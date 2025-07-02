#!/usr/bin/env python
"""
Email notification service for change detection alerts

This module provides email notification functionality for the change detection system.
"""

import os
import smtplib
import argparse
import json
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from datetime import datetime, timedelta

# Email configuration
SENDER_EMAIL = 'sankalpasarkar68@gmail.com'
SENDER_PASSWORD = ''  # App-specific password

def send_alert_email(recipient, alert_data, aoi_name, image_paths=None, monitoring_schedule=None):
    """
    Send an email notification for a change detection alert.
    
    Args:
        recipient (str): Email address to send the notification to
        alert_data (dict): Alert data including type, severity, confidence, description
        aoi_name (str): Name of the Area of Interest
        image_paths (list, optional): List of paths to before/after/change map images
        monitoring_schedule (dict, optional): Dictionary containing monitoring schedule info
            - start_date: Start date of monitoring (string in ISO format)
            - end_date: End date of monitoring (string in ISO format)
            - frequency: Frequency of monitoring ('continuous', 'daily', 'weekly', etc.)
        
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    try:
        # Create multipart message
        msg = MIMEMultipart()
        
        # Create a more informative subject line that includes monitoring info if available
        subject = f"ISRO Change Detection Alert: {alert_data['type'].replace('_', ' ').title()} in {aoi_name}"
        
        # Add monitoring frequency to subject if available
        if monitoring_schedule and monitoring_schedule.get('frequency'):
            frequency = monitoring_schedule.get('frequency')
            if frequency == 'continuous':
                subject += " (Real-time Monitoring)"
            elif frequency in ['daily', 'weekly']:
                subject += f" ({frequency.title()} Monitoring)"
        
        msg['Subject'] = subject
        msg['From'] = SENDER_EMAIL
        msg['To'] = recipient
        
        # Create HTML content with severity-based styling
        severity_colors = {
            'high': '#d9534f',  # Red
            'medium': '#f0ad4e',  # Yellow/Orange
            'low': '#5bc0de'  # Blue
        }
        
        # Format confidence as percentage
        confidence_percent = f"{int(alert_data['confidence'] * 100)}%"
        
        # Get current date and time
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Monitoring schedule section
        monitoring_info = ""
        if monitoring_schedule:
            try:
                start_date = monitoring_schedule.get('start_date')
                end_date = monitoring_schedule.get('end_date')
                frequency = monitoring_schedule.get('frequency', 'continuous')
                
                # Format dates if they exist
                start_formatted = datetime.fromisoformat(start_date.replace('Z', '+00:00')).strftime("%B %d, %Y") if start_date else None
                end_formatted = datetime.fromisoformat(end_date.replace('Z', '+00:00')).strftime("%B %d, %Y") if end_date else None
                
                monitoring_info = f"""
                <div style="margin-top: 20px; padding: 15px; border: 1px solid #ddd; background-color: #f0f8ff; border-radius: 4px;">
                  <h3 style="margin-top: 0; color: #0B60B0;">Monitoring Schedule</h3>
                  <p><strong>Start Date:</strong> {start_formatted if start_formatted else 'Ongoing'}</p>
                """
                
                if end_formatted:
                    monitoring_info += f"<p><strong>End Date:</strong> {end_formatted}</p>"
                else:
                    monitoring_info += "<p><strong>End Date:</strong> Continuous monitoring</p>"
                
                frequency_display = {
                    'continuous': 'Real-time monitoring',
                    'daily': 'Daily updates',
                    'weekly': 'Weekly updates'
                }.get(frequency, frequency.title())
                
                monitoring_info += f"<p><strong>Frequency:</strong> {frequency_display}</p>"
                monitoring_info += "</div>"
            except Exception as e:
                print(f"Error formatting monitoring schedule: {e}")
                monitoring_info = ""

        # Create email body
        html = f"""
        <html>
          <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #0B60B0; padding: 20px; text-align: center; color: white;">
              <h1 style="margin: 0;">Change Detection Alert</h1>
              <p>ISRO Satellite Monitoring System</p>
            </div>
            
            <div style="padding: 20px; border: 1px solid #ddd; background-color: #f9f9f9;">
              <h2 style="color: {severity_colors.get(alert_data['severity'], '#333')};">
                {alert_data['type'].replace('_', ' ').title()} Alert
              </h2>
              
              <div style="margin: 20px 0; padding: 15px; border-left: 4px solid {severity_colors.get(alert_data['severity'], '#333')}; background-color: #fff;">
                <p><strong>Area of Interest:</strong> {aoi_name}</p>
                <p><strong>Severity:</strong> <span style="color: {severity_colors.get(alert_data['severity'], '#333')};">{alert_data['severity'].upper()}</span></p>
                <p><strong>Confidence:</strong> {confidence_percent}</p>
                <p><strong>Detection Time:</strong> {current_time}</p>
                <p><strong>Description:</strong> {alert_data['description']}</p>
              </div>
              
              {monitoring_info}
              
              <div style="margin-top: 20px;">
                <p>This is an automated alert from the ISRO Change Monitoring System. Please log in to your dashboard to view more details and take appropriate action.</p>
                <p style="text-align: center; margin-top: 20px;">
                  <a href="{os.environ.get('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000')}/dashboard" style="background-color: #0B60B0; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View in Dashboard</a>
                </p>
              </div>
            </div>
            
            <div style="padding: 10px; text-align: center; font-size: 12px; color: #666; margin-top: 20px;">
              &copy; {datetime.now().year} ISRO Change Monitoring System. All rights reserved.<br>
              <small>If you believe this alert was sent in error, please mark it as a false positive in your dashboard.</small>
            </div>
          </body>
        </html>
        """
        
        # Attach HTML content
        msg.attach(MIMEText(html, 'html'))
        
        # Attach images if provided
        if image_paths and isinstance(image_paths, list):
            for i, img_path in enumerate(image_paths):
                if os.path.isfile(img_path):
                    with open(img_path, 'rb') as img_file:
                        img = MIMEImage(img_file.read())
                        img.add_header('Content-ID', f'<image{i}>')
                        img.add_header('Content-Disposition', 'inline', filename=os.path.basename(img_path))
                        msg.attach(img)
        
        # Connect to Gmail SMTP server
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        
        # Send email
        server.send_message(msg)
        server.quit()
        
        print(f"Email alert sent successfully to {recipient}")
        return True
    
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

def main():
    """Main function to run email notifications from command line"""
    parser = argparse.ArgumentParser(description='Send change detection email notifications')
    parser.add_argument('--recipient', required=True, help='Email address to send the notification to')
    parser.add_argument('--alert', required=True, help='JSON string or file path with alert data')
    parser.add_argument('--aoi-name', required=True, help='Name of the Area of Interest')
    parser.add_argument('--images', nargs='+', help='Paths to images to include in the email')
    parser.add_argument('--schedule', help='JSON string with monitoring schedule data')
    
    args = parser.parse_args()
    
    # Parse alert data
    try:
        # Check if the alert arg is a file path
        if os.path.isfile(args.alert):
            with open(args.alert, 'r') as f:
                alert_data = json.load(f)
        else:
            # Assume it's a JSON string
            alert_data = json.loads(args.alert)
    except Exception as e:
        print(f"Error parsing alert data: {e}")
        return 1
    
    # Parse monitoring schedule if provided
    monitoring_schedule = None
    if args.schedule:
        try:
            monitoring_schedule = json.loads(args.schedule)
        except Exception as e:
            print(f"Warning: Could not parse monitoring schedule: {e}")
    
    # Send the email
    success = send_alert_email(args.recipient, alert_data, args.aoi_name, args.images, monitoring_schedule)
    
    return 0 if success else 1

if __name__ == "__main__":
    import sys
    sys.exit(main())
