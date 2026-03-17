"""
Report Routes
Endpoints for generating and managing scheduled reports
"""

from flask import Blueprint, request, jsonify, send_file
import os
from datetime import datetime
from functools import wraps

from services.report_generator import ReportGenerator
from services.scheduler_service import SchedulerService
from config.settings import Config


reports_bp = Blueprint('reports', __name__, url_prefix='/api/reports')
report_generator = ReportGenerator()
scheduler = SchedulerService()


def validate_auth(f):
    """Decorator to validate authorization header"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        
        if not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid authorization'}), 401
        
        # Note: In production, validate the JWT token here
        # For now, we're assuming the token has been validated at the API gateway level
        return f(*args, **kwargs)
    
    return decorated_function


@reports_bp.route('/export', methods=['POST'])
@validate_auth
def export_report():
    """
    Export a report in specified format
    
    Request body:
    {
        "type": "summary|sales-trend|profit-trend|expense-distribution|expenses",
        "format": "pdf|xlsx",
        "range": "daily|weekly|monthly|custom",
        "startDate": "YYYY-MM-DD" (optional, for custom range),
        "endDate": "YYYY-MM-DD" (optional, for custom range)
    }
    """
    try:
        data = request.get_json() or {}
        
        report_type = data.get('type', 'summary')
        format = data.get('format', 'pdf').lower()
        date_range = data.get('range', 'monthly')
        start_date = data.get('startDate')
        end_date = data.get('endDate')
        
        # Validate format
        if format not in Config.SUPPORTED_FORMATS:
            return jsonify({
                'error': f"Unsupported format. Supported: {', '.join(Config.SUPPORTED_FORMATS)}"
            }), 400
        
        # Parse date range
        if date_range == 'custom' and (not start_date or not end_date):
            return jsonify({'error': 'startDate and endDate required for custom range'}), 400
        
        # For now, we're generating full reports
        # In production, you'd filter based on the range and dates
        
        # Generate report
        result = report_generator.generate_report(
            report_type=report_type,
            format=format,
            start_date=start_date,
            end_date=end_date
        )
        
        if not result['success']:
            return jsonify(result), 500
        
        filepath = result['filepath']
        
        # Send file
        return send_file(
            filepath,
            as_attachment=True,
            download_name=result['filename'],
            mimetype='application/pdf' if format == 'pdf' else 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@reports_bp.route('/schedule', methods=['POST'])
@validate_auth
def create_scheduled_report():
    """
    Create a scheduled report
    
    Request body:
    {
        "reportType": "summary|sales-trend|profit-trend|expense-distribution|expenses",
        "format": "pdf|xlsx",
        "frequency": "daily|weekly|monthly",
        "recipients": ["email1@example.com", "email2@example.com"],
        "enabled": true
    }
    """
    try:
        data = request.get_json() or {}
        
        report_type = data.get('reportType')
        format = data.get('format', 'pdf').lower()
        frequency = data.get('frequency', 'daily').lower()
        recipients = data.get('recipients', [])
        enabled = data.get('enabled', True)
        
        # Validate inputs
        if not report_type:
            return jsonify({'error': 'reportType is required'}), 400
        
        if format not in Config.SUPPORTED_FORMATS:
            return jsonify({
                'error': f"Unsupported format. Supported: {', '.join(Config.SUPPORTED_FORMATS)}"
            }), 400
        
        if frequency not in Config.SUPPORTED_FREQUENCIES:
            return jsonify({
                'error': f"Unsupported frequency. Supported: {', '.join(Config.SUPPORTED_FREQUENCIES)}"
            }), 400
        
        # Create schedule
        result = scheduler.create_schedule(
            report_type=report_type,
            format=format,
            frequency=frequency,
            recipients=recipients,
            enabled=enabled
        )
        
        return jsonify(result), 201 if result['success'] else 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@reports_bp.route('/schedules', methods=['GET'])
@validate_auth
def list_schedules():
    """List all scheduled reports"""
    try:
        result = scheduler.list_schedules()
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@reports_bp.route('/schedules/<schedule_id>', methods=['GET'])
@validate_auth
def get_schedule(schedule_id):
    """Get details of a specific schedule"""
    try:
        result = scheduler.get_schedule(schedule_id)
        status_code = 200 if result['success'] else 404
        return jsonify(result), status_code
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@reports_bp.route('/schedules/<schedule_id>', methods=['PUT'])
@validate_auth
def update_schedule(schedule_id):
    """Update a scheduled report"""
    try:
        data = request.get_json() or {}
        
        result = scheduler.update_schedule(schedule_id, **data)
        status_code = 200 if result['success'] else 400
        return jsonify(result), status_code
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@reports_bp.route('/schedules/<schedule_id>', methods=['DELETE'])
@validate_auth
def delete_schedule(schedule_id):
    """Delete a scheduled report"""
    try:
        result = scheduler.delete_schedule(schedule_id)
        status_code = 200 if result['success'] else 404
        return jsonify(result), status_code
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@reports_bp.route('/schedules/<schedule_id>/run', methods=['POST'])
@validate_auth
def run_scheduled_report(schedule_id):
    """Manually trigger a scheduled report"""
    try:
        schedule_info = scheduler.get_schedule(schedule_id)
        if not schedule_info['success']:
            return jsonify(schedule_info), 404
        
        schedule_obj = schedule_info['schedule']
        
        # Execute the report
        scheduler.execute_scheduled_report(
            schedule_id,
            schedule_obj['report_type'],
            schedule_obj['format'],
            schedule_obj['recipients']
        )
        
        return jsonify({
            'success': True,
            'message': f'Report execution triggered for schedule {schedule_id}'
        }), 202
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@reports_bp.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'scheduler_running': scheduler.is_running,
        'generated_reports_dir': Config.REPORTS_DIR,
    }), 200

