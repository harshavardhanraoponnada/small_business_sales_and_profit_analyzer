import pandas as pd
import os
from datetime import datetime

class DataLoader:
    """Load and preprocess data from CSV files"""
    
    @staticmethod
    def load_sales_data(data_dir):
        """Load sales data from CSV"""
        try:
            sales_file = os.path.join(data_dir, 'sales.csv')
            if not os.path.exists(sales_file):
                return pd.DataFrame()
            
            df = pd.read_csv(sales_file)
            df['date'] = pd.to_datetime(df['date'])
            df['total'] = pd.to_numeric(df['total'], errors='coerce')
            df = df.sort_values('date')
            
            # Aggregate by day
            daily_sales = df.groupby(df['date'].dt.date)['total'].sum().reset_index()
            daily_sales.columns = ['ds', 'y']
            daily_sales['ds'] = pd.to_datetime(daily_sales['ds'])
            
            return daily_sales
        except Exception as e:
            print(f"Error loading sales data: {e}")
            return pd.DataFrame()
    
    @staticmethod
    def load_expenses_data(data_dir):
        """Load expenses data from CSV"""
        try:
            expenses_file = os.path.join(data_dir, 'expenses.csv')
            if not os.path.exists(expenses_file):
                return pd.DataFrame()
            
            df = pd.read_csv(expenses_file)
            df['date'] = pd.to_datetime(df['date'])
            df['amount'] = pd.to_numeric(df['amount'], errors='coerce')
            df = df.sort_values('date')
            
            # Aggregate by day
            daily_expenses = df.groupby(df['date'].dt.date)['amount'].sum().reset_index()
            daily_expenses.columns = ['ds', 'y']
            daily_expenses['ds'] = pd.to_datetime(daily_expenses['ds'])
            
            return daily_expenses
        except Exception as e:
            print(f"Error loading expenses data: {e}")
            return pd.DataFrame()
    
    @staticmethod
    def validate_data(df, min_points=10):
        """Validate data has sufficient points"""
        return len(df) >= min_points    
    @staticmethod
    def load_raw_sales_data(data_dir, start_date=None, end_date=None):
        """Load raw sales data with cost information for reports"""
        try:
            sales_file = os.path.join(data_dir, 'sales.csv')
            if not os.path.exists(sales_file):
                print(f"Sales file not found: {sales_file}")
                return pd.DataFrame()
            
            df = pd.read_csv(sales_file)
            
            # Handle date column with better error handling
            df['date'] = pd.to_datetime(df['date'], errors='coerce', utc=True)
            df['date'] = df['date'].dt.tz_localize(None) if df['date'].dt.tz is not None else df['date']
            
            # Remove any rows with invalid dates
            df = df.dropna(subset=['date'])
            
            # Convert numeric columns
            for col in ['quantity', 'unit_price', 'total']:
                if col in df.columns:
                    df[col] = pd.to_numeric(df[col], errors='coerce')
            
            # Sort by date
            df = df.sort_values('date')
            
            # Filter by date range if provided
            if start_date:
                start_date = pd.to_datetime(start_date)
                df = df[df['date'] >= start_date]
            if end_date:
                end_date = pd.to_datetime(end_date)
                df = df[df['date'] <= end_date]
            
            print(f"Loaded {len(df)} sales records")
            return df
        except Exception as e:
            print(f"Error loading raw sales data: {e}")
            import traceback
            traceback.print_exc()
            return pd.DataFrame()
    
    @staticmethod
    def load_raw_expenses_data(data_dir, start_date=None, end_date=None):
        """Load raw expenses data for reports"""
        try:
            expenses_file = os.path.join(data_dir, 'expenses.csv')
            if not os.path.exists(expenses_file):
                print(f"Expenses file not found: {expenses_file}")
                return pd.DataFrame()
            
            df = pd.read_csv(expenses_file)
            
            # Handle date column with better error handling
            df['date'] = pd.to_datetime(df['date'], errors='coerce', utc=True)
            df['date'] = df['date'].dt.tz_localize(None) if df['date'].dt.tz is not None else df['date']
            
            # Remove any rows with invalid dates
            df = df.dropna(subset=['date'])
            
            # Convert amount column
            if 'amount' in df.columns:
                df['amount'] = pd.to_numeric(df['amount'], errors='coerce')
            
            # Sort by date
            df = df.sort_values('date')
            
            # Filter by date range if provided
            if start_date:
                start_date = pd.to_datetime(start_date)
                df = df[df['date'] >= start_date]
            if end_date:
                end_date = pd.to_datetime(end_date)
                df = df[df['date'] <= end_date]
            
            print(f"Loaded {len(df)} expense records")
            return df
        except Exception as e:
            print(f"Error loading raw expenses data: {e}")
            import traceback
            traceback.print_exc()
            return pd.DataFrame()
    
    @staticmethod
    def load_products_data(data_dir):
        """Load products and variants data for detailed reports"""
        try:
            products_file = os.path.join(data_dir, 'products.csv')
            variants_file = os.path.join(data_dir, 'variants.csv')
            
            products = pd.DataFrame()
            variants = pd.DataFrame()
            
            if os.path.exists(products_file):
                products = pd.read_csv(products_file)
            if os.path.exists(variants_file):
                variants = pd.read_csv(variants_file)
            
            return products, variants
        except Exception as e:
            print(f"Error loading products data: {e}")
            return pd.DataFrame(), pd.DataFrame()