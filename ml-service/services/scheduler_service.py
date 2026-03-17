"""
Scheduled Report Service
Manages scheduled report generation and email distribution
"""

import os
import json
import schedule
import threading
import smtplib
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import uuid

from config.settings import Config
from services.report_generator import ReportGenerator


class SchedulerService:
    """Manage scheduled report generation and delivery"""
    
    def __init__(self):
        self.schedules_file = Config.SCHEDULES_FILE
        self.schedules = {}
        self.scheduler_thread = None
        self.is_running = False
        self.report_generator = ReportGenerator()
        self.load_schedules()
    
    def load_schedules(self):
        """Load scheduled reports from JSON file"""
        try:
            if os.path.exists(self.schedules_file):
                with open(self.schedules_file, 'r') as f:
                    self.schedules = json.load(f)
        except Exception as e:
            print(f"Error loading schedules: {e}")
            self.schedules = {}
    
    def save_schedules(self):
        """Save scheduled reports to JSON file"""
        try:
            os.makedirs(os.path.dirname(self.schedules_file), exist_ok=True)
            with open(self.schedules_file, 'w') as f:
                json.dump(self.schedules, f, indent=2, default=str)
        except Exception as e:
            print(f"Error saving schedules: {e}")
    
    def create_schedule(self, report_type, format='pdf', frequency='daily', recipients=None, enabled=True):
        """Create a new scheduled report"""
        try:
            schedule_id = str(uuid.uuid4())
            
            schedule_obj = {
                'id': schedule_id,
                'report_type': report_type,
                'format': format,
                'frequency': frequency,
                'recipients': recipients or [],
                'enabled': enabled,
                'created_at': datetime.now().isoformat(),
                'last_run': None,
                'next_run': None,
            }
            
            # Validate inputs
            if format not in Config.SUPPORTED_FORMATS:
                return {'success': False, 'error': f"Unsupported format: {format}"}
            if frequency not in Config.SUPPORTED_FREQUENCIES:
                return {'success': False, 'error': f"Unsupported frequency: {frequency}"}
            
            self.schedules[schedule_id] = schedule_obj
            self.save_schedules()
            
            # Register the schedule if enabled
            if enabled:
                self.register_schedule(schedule_id, schedule_obj)
            
            return {
                'success': True,
                'schedule_id': schedule_id,
                'schedule': schedule_obj
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def register_schedule(self, schedule_id, schedule_obj):
        """Register a schedule with the scheduler"""
        try:
            frequency = schedule_obj['frequency']
            report_type = schedule_obj['report_type']
            format = schedule_obj['format']
            recipients = schedule_obj['recipients']
            
            # Create job function
            job_func = lambda: self.execute_scheduled_report(
                schedule_id, report_type, format, recipients
            )
            
            # Register job based on frequency
            if frequency == 'daily':
                schedule.every().day.at("09:00").do(job_func).tag(schedule_id)
            elif frequency == 'weekly':
                schedule.every().monday.at("09:00").do(job_func).tag(schedule_id)
            elif frequency == 'monthly':
                # Schedule for the 1st of each month
                schedule.every().day.at("09:00").do(self._check_monthly, schedule_id, job_func).tag(schedule_id)
        except Exception as e:
            print(f"Error registering schedule: {e}")
    
    def _check_monthly(self, schedule_id, job_func):
        """Helper to run monthly schedules on the 1st of the month"""
        if datetime.now().day == 1:
            job_func()
    
    def execute_scheduled_report(self, schedule_id, report_type, format, recipients):
        """Execute a scheduled report generation and send it"""
        try:
            print(f"Executing scheduled report: {schedule_id}")
            
            # Generate report
            result = self.report_generator.generate_report(
                report_type=report_type,
                format=format
            )
            
            if result['success']:
                filepath = result['filepath']
                
                # Send email if recipients provided
                if recipients:
                    for recipient in recipients:
                        self.send_report_email(
                            recipient_email=recipient,
                            report_type=report_type,
                            filepath=filepath,
                            metrics=result.get('metrics', {})
                        )
                
                # Update last run time
                if schedule_id in self.schedules:
                    self.schedules[schedule_id]['last_run'] = datetime.now().isoformat()
                    self.save_schedules()
                
                print(f"Successfully executed schedule {schedule_id}")
            else:
                print(f"Failed to generate report for schedule {schedule_id}: {result.get('error')}")
        except Exception as e:
            print(f"Error executing scheduled report: {e}")
    
    def send_report_email(self, recipient_email, report_type, filepath, metrics=None):
        """Send generated report via email"""
        try:
            # Get SMTP settings from environment
            smtp_server = os.getenv('MAIL_SMTP_SERVER', 'smtp.gmail.com')
            smtp_port = int(os.getenv('MAIL_SMTP_PORT', 587))
            sender_email = os.getenv('MAIL_USER', 'your-email@gmail.com')
            sender_password = os.getenv('MAIL_PASS', 'your-password')
            
            # Create message
            msg = MIMEMultipart()
            msg['From'] = sender_email
            msg['To'] = recipient_email
            msg['Subject'] = f'{report_type.title()} Report - {datetime.now().strftime("%Y-%m-%d")}'
            
            # Email body
            body = self._create_email_body(report_type, metrics)
            msg.attach(MIMEText(body, 'html'))
            
            # Attach report file
            if filepath and os.path.exists(filepath):
                filename = os.path.basename(filepath)
                attachment = MIMEBase('application', 'octet-stream')
                
                with open(filepath, 'rb') as attachment_file:
                    attachment.set_payload(attachment_file.read())
                
                encoders.encode_base64(attachment)
                attachment.add_header('Content-Disposition', f'attachment; filename= {filename}')
                msg.attach(attachment)
            
            # Send email
            with smtplib.SMTP(smtp_server, smtp_port) as server:
                server.starttls()
                server.login(sender_email, sender_password)
                server.send_message(msg)
            
            print(f"Email sent successfully to {recipient_email}")
            return {'success': True}
        except Exception as e:
            print(f"Error sending email: {e}")
            return {'success': False, 'error': str(e)}
    
    def _create_email_body(self, report_type, metrics):
        """Create HTML email body with metrics"""
        metrics = metrics or {}
        
        html_body = f"""
        <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; }}
                    .header {{ background-color: #4472C4; color: white; padding: 20px; text-align: center; }}
                    .content {{ padding: 20px; }}
                    .metrics {{ margin: 20px 0; }}
                    .metric-row {{ display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #ddd; }}
                    .metric-label {{ font-weight: bold; }}
                    .metric-value {{ text-align: right; }}
                    .footer {{ text-align: center; color: #999; font-size: 12px; padding: 20px; }}
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>{report_type.replace('_', ' ').title()} Report</h1>
                </div>
                <div class="content">
                    <p>Attached is your scheduled {report_type.replace('_', ' ').lower()} report.</p>
                    
                    <div class="metrics">
                        <h2>Key Metrics</h2>
                        <div class="metric-row">
                            <span class="metric-label">Total Revenue:</span>
                            <span class="metric-value">${metrics.get('total_revenue', 0):,.2f}</span>
                        </div>
                        <div class="metric-row">
                            <span class="metric-label">Total Expense:</span>
                            <span class="metric-value">${metrics.get('total_expense', 0):,.2f}</span>
                        </div>
                        <div class="metric-row">
                            <span class="metric-label">Total Profit:</span>
                            <span class="metric-value">${metrics.get('total_profit', 0):,.2f}</span>
                        </div>
                        <div class="metric-row">
                            <span class="metric-label">Profit Margin:</span>
                            <span class="metric-value">{metrics.get('profit_margin', 0):.2f}%</span>
                        </div>
                    </div>
                    
                    <p>Report generated on {metrics.get('generated_at', 'N/A')}</p>
                </div>
                <div class="footer">
                    <p>This is an automated email. Please do not reply.</p>
                </div>
            </body>
        </html>
        """
        return html_body
    
    def update_schedule(self, schedule_id, **kwargs):
        """Update an existing schedule"""
        try:
            if schedule_id not in self.schedules:
                return {'success': False, 'error': 'Schedule not found'}
            
            schedule_obj = self.schedules[schedule_id]
            
            # Update allowed fields
            allowed_updates = ['enabled', 'recipients', 'frequency', 'format']
            for key, value in kwargs.items():
                if key in allowed_updates:
                    schedule_obj[key] = value
            
            # Re-register schedule if enabled status changed
            if 'enabled' in kwargs:
                schedule.clear(schedule_id)
                if kwargs['enabled']:
                    self.register_schedule(schedule_id, schedule_obj)
            
            self.save_schedules()
            return {'success': True, 'schedule': schedule_obj}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def delete_schedule(self, schedule_id):
        """Delete a scheduled report"""
        try:
            if schedule_id in self.schedules:
                schedule.clear(schedule_id)
                del self.schedules[schedule_id]
                self.save_schedules()
                return {'success': True}
            return {'success': False, 'error': 'Schedule not found'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def get_schedule(self, schedule_id):
        """Get details of a specific schedule"""
        if schedule_id in self.schedules:
            return {'success': True, 'schedule': self.schedules[schedule_id]}
        return {'success': False, 'error': 'Schedule not found'}
    
    def list_schedules(self):
        """List all schedules"""
        return {
            'success': True,
            'schedules': list(self.schedules.values()),
            'count': len(self.schedules)
        }
    
    def start_scheduler(self):
        """Start the background scheduler thread"""
        if self.is_running:
            return {'success': False, 'error': 'Scheduler already running'}
        
        try:
            self.is_running = True
            self.scheduler_thread = threading.Thread(target=self._run_scheduler, daemon=True)
            self.scheduler_thread.start()
            
            # Re-register all enabled schedules
            for schedule_id, schedule_obj in self.schedules.items():
                if schedule_obj['enabled']:
                    self.register_schedule(schedule_id, schedule_obj)
            
            print("Scheduler started successfully")
            return {'success': True, 'message': 'Scheduler started'}
        except Exception as e:
            self.is_running = False
            return {'success': False, 'error': str(e)}
    
    def stop_scheduler(self):
        """Stop the background scheduler"""
        try:
            self.is_running = False
            schedule.clear()
            print("Scheduler stopped")
            return {'success': True, 'message': 'Scheduler stopped'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _run_scheduler(self):
        """Run the scheduler loop"""
        while self.is_running:
            try:
                schedule.run_pending()
                import time
                time.sleep(60)  # Check every minute
            except Exception as e:
                print(f"Error in scheduler loop: {e}")

