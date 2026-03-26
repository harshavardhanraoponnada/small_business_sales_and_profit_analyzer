"""
Database Loader for ML Service
Loads sales and expenses data directly from PostgreSQL (Prisma)
instead of CSV files to use live, current data for predictions
"""

import psycopg2
from psycopg2.extras import RealDictCursor
import pandas as pd
from datetime import datetime, timedelta
import os


class DatabaseLoader:
    """Load real-time data from PostgreSQL for forecasting"""

    def __init__(self, database_url):
        """
        Initialize database connection

        Args:
            database_url: PostgreSQL connection string
                         e.g., "postgresql://user:pass@host:5432/db?schema=public"
        """
        self.database_url = database_url
        self.connection = None

    def connect(self):
        """Establish database connection"""
        try:
            self.connection = psycopg2.connect(self.database_url)
        except psycopg2.Error as e:
            print(f"Database connection error: {e}")
            raise

    def disconnect(self):
        """Close database connection"""
        if self.connection:
            self.connection.close()

    def load_sales_data(self, days_back=None):
        """
        Load sales data from PostgreSQL

        Args:
            days_back: Number of days to include (default: all available)

        Returns:
            DataFrame with columns ['ds', 'y'] formatted for Prophet
        """
        try:
            if not self.connection:
                self.connect()

            with self.connection.cursor(cursor_factory=RealDictCursor) as cur:
                # Query to aggregate sales by date
                query = """
                    SELECT 
                        CAST(created_at AS DATE) as date,
                        SUM(CAST(selling_price AS FLOAT) * quantity) as total
                    FROM "Sales"
                    WHERE deleted_at IS NULL
                    {date_filter}
                    GROUP BY CAST(created_at AS DATE)
                    ORDER BY date ASC
                """.format(
                    date_filter=f"AND CAST(created_at AS DATE) >= CURRENT_DATE - INTERVAL '{days_back} days'" if days_back else ""
                )

                cur.execute(query)
                rows = cur.fetchall()

                if not rows:
                    print("Warning: No sales data found in database")
                    return self._empty_dataframe()

                # Convert to pandas DataFrame with Prophet format
                data = [
                    {"ds": row["date"], "y": row["total"]}
                    for row in rows
                ]

                df = pd.DataFrame(data)
                df["ds"] = pd.to_datetime(df["ds"])
                df["y"] = pd.to_numeric(df["y"], errors="coerce")

                print(f"Loaded {len(df)} sales records from {df['ds'].min()} to {df['ds'].max()}")
                return df

        except psycopg2.Error as e:
            print(f"Error loading sales data: {e}")
            return self._empty_dataframe()

    def load_expenses_data(self, days_back=None):
        """
        Load expenses data from PostgreSQL

        Args:
            days_back: Number of days to include (default: all available)

        Returns:
            DataFrame with columns ['ds', 'y'] formatted for Prophet
        """
        try:
            if not self.connection:
                self.connect()

            with self.connection.cursor(cursor_factory=RealDictCursor) as cur:
                # Query to aggregate expenses by date
                query = """
                    SELECT 
                        CAST(created_at AS DATE) as date,
                        SUM(CAST(amount AS FLOAT)) as total
                    FROM "Expense"
                    WHERE deleted_at IS NULL
                    {date_filter}
                    GROUP BY CAST(created_at AS DATE)
                    ORDER BY date ASC
                """.format(
                    date_filter=f"AND CAST(created_at AS DATE) >= CURRENT_DATE - INTERVAL '{days_back} days'" if days_back else ""
                )

                cur.execute(query)
                rows = cur.fetchall()

                if not rows:
                    print("Warning: No expenses data found in database")
                    return self._empty_dataframe()

                # Convert to pandas DataFrame with Prophet format
                data = [
                    {"ds": row["date"], "y": row["total"]}
                    for row in rows
                ]

                df = pd.DataFrame(data)
                df["ds"] = pd.to_datetime(df["ds"])
                df["y"] = pd.to_numeric(df["y"], errors="coerce")

                print(f"Loaded {len(df)} expense records from {df['ds'].min()} to {df['ds'].max()}")
                return df

        except psycopg2.Error as e:
            print(f"Error loading expenses data: {e}")
            return self._empty_dataframe()

    @staticmethod
    def _empty_dataframe():
        """Return empty DataFrame in Prophet format"""
        return pd.DataFrame(columns=["ds", "y"])
