#!/usr/bin/env python
"""
Wrapper script for change detection

This script acts as a wrapper for the change detection system,
ensuring proper path handling and module imports regardless of operating system.
"""

import os
import sys
import subprocess
import argparse
import json
import shutil

def main():
    # Get the current directory (where this script is located)
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Add the current directory to the Python path
    sys.path.insert(0, current_dir)
    
    # Add ml directory to the Python path
    ml_dir = os.path.join(current_dir, 'ml')
    if os.path.exists(ml_dir):
        sys.path.insert(0, ml_dir)
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Run change detection wrapper')
    parser.add_argument('--input', '-i', required=True, help='Path to input JSON file with AOI data')
    parser.add_argument('--output', '-o', required=True, help='Path to output JSON file for results')
    parser.add_argument('--config', '-c', help='Path to optional configuration file')
    parser.add_argument('--debug', '-d', action='store_true', help='Enable debug output')
    
    args = parser.parse_args()
    
    debug = args.debug
    
    # Print system info for debugging
    if debug:
        print(f"Python version: {sys.version}")
        print(f"Platform: {sys.platform}")
        print(f"Working directory: {os.getcwd()}")
        print(f"Script directory: {current_dir}")
        print(f"Python path: {sys.path}")
        print(f"Python executable: {sys.executable}")
        print(f"All args: {sys.argv}")
    
    # Check if input file exists
    if not os.path.exists(args.input):
        print(f"Error: Input file not found: {args.input}", file=sys.stderr)
        return 1
    
    # Debug info
    if debug:
        print(f"Working directory: {os.getcwd()}")
        print(f"Script directory: {current_dir}")
        print(f"Python executable: {sys.executable}")
        print(f"Input file: {args.input}")
        print(f"Output file: {args.output}")
    
    # For testing purposes: create a dummy result file if the actual module isn't available
    try:
        ml_script = os.path.join(current_dir, 'ml', 'run_detection.py')
        if debug:
            print(f"Looking for ML script at: {ml_script}")
            print(f"ML script exists: {os.path.exists(ml_script)}")
        
        if not os.path.exists(ml_script):
            print(f"Warning: ML script not found at {ml_script}. Creating dummy result for testing.", file=sys.stderr)
            # Read input file to get AOI info
            with open(args.input, 'r') as f:
                aoi_data = json.load(f)
            
            # Create a dummy result
            # Include monitoring schedule info in the result if available
            monitoring_info = {}
            
            # Extract monitoring info from aoi_data
            if "monitoringDates" in aoi_data:
                monitoring_info = {
                    "monitoringSchedule": {
                        "start_date": aoi_data.get("monitoringDates", {}).get("start"),
                        "end_date": aoi_data.get("monitoringDates", {}).get("end"),
                        "frequency": aoi_data.get("frequency", "continuous")
                    }
                }
            elif "customDates" in aoi_data:
                monitoring_info = {
                    "monitoringSchedule": {
                        "start_date": aoi_data.get("customDates", {}).get("startDate"),
                        "end_date": aoi_data.get("customDates", {}).get("endDate"),
                        "frequency": aoi_data.get("frequency", "continuous")
                    }
                }
                
            dummy_result = {
                "success": True,
                "message": "This is a dummy result for testing",
                "alert_data": {
                    "type": aoi_data.get("alertType", "deforestation"),
                    "severity": "medium",
                    "confidence": 0.85,
                    "description": f"Simulated change detection for testing in {aoi_data.get('aoi_id', 'unknown')}",
                    "detectedChange": True,
                    **monitoring_info
                }
            }
            
            # Save the dummy result
            with open(args.output, 'w') as f:
                json.dump(dummy_result, f, indent=2)
            
            print("Created dummy result file for testing.")
            return 0
    
        # Build the command for the actual script
        # Handle paths with spaces properly
        input_path = os.path.abspath(args.input)
        output_path = os.path.abspath(args.output)
        
        if debug:
            print(f"Input file (absolute): {input_path}")
            print(f"Output file (absolute): {output_path}")
            print(f"ML Script path: {ml_script}")
        
        # Check if paths contain spaces and quote them if necessary
        if sys.platform == "win32":
            # For Windows, always use a list of arguments without quotes in the list items
            # subprocess will handle the quoting correctly
            cmd = [
                sys.executable,  # Use the same Python interpreter
                ml_script,
                "--input", input_path,
                "--output", output_path
            ]
            
            if args.config:
                config_path = os.path.abspath(args.config)
                cmd.extend(['--config', config_path])
            
            if debug:
                print(f"Running command: {cmd}")
            
            # Use a more robust approach for Windows with spaces in paths
            try:
                # Use shell=False for better security and proper path handling
                process = subprocess.run(cmd, shell=False, capture_output=True, text=True, check=False)
                if process.returncode != 0:
                    print(f"Process failed with return code {process.returncode}", file=sys.stderr)
                    print(f"Stderr: {process.stderr}", file=sys.stderr)
                    raise subprocess.SubprocessError(f"Process failed with return code {process.returncode}")
            except Exception as sub_err:
                # If that fails, log the error and try an alternative approach
                print(f"Subprocess execution failed: {sub_err}", file=sys.stderr)
                print("Trying alternative execution method", file=sys.stderr)
                
                # Try using a direct command through cmd.exe
                cmd_args = ['cmd.exe', '/c', sys.executable, ml_script, 
                           "--input", input_path, "--output", output_path]
                if args.config:
                    cmd_args.extend(['--config', config_path])
                
                process = subprocess.run(cmd_args, shell=False, capture_output=True, text=True)
        else:
            # For non-Windows systems
            cmd = [
                sys.executable,  # Use the same Python interpreter
                ml_script,
                "--input", input_path,
                "--output", output_path
            ]
            
            if args.config:
                cmd.extend(['--config', os.path.abspath(args.config)])
            
            if debug:
                print(f"Running command: {' '.join(cmd)}")
            
            # Execute the command with proper subprocess handling
            process = subprocess.run(cmd, check=True, capture_output=True, text=True)
        print(process.stdout)
        if process.stderr:
            print(f"Stderr: {process.stderr}", file=sys.stderr)
        return 0
    except Exception as e:
        print(f"Error running detection script: {e}", file=sys.stderr)
        
        # For resilience: create a dummy result even if script fails
        try:
            # Read input file to get AOI info
            with open(args.input, 'r') as f:
                aoi_data = json.load(f)
            
            # Create a dummy result with monitoring info
            monitoring_info = {}
            
            # Extract monitoring info from aoi_data
            if "monitoringDates" in aoi_data:
                monitoring_info = {
                    "monitoringSchedule": {
                        "start_date": aoi_data.get("monitoringDates", {}).get("start"),
                        "end_date": aoi_data.get("monitoringDates", {}).get("end"),
                        "frequency": aoi_data.get("frequency", "continuous")
                    }
                }
            elif "customDates" in aoi_data:
                monitoring_info = {
                    "monitoringSchedule": {
                        "start_date": aoi_data.get("customDates", {}).get("startDate"),
                        "end_date": aoi_data.get("customDates", {}).get("endDate"),
                        "frequency": aoi_data.get("frequency", "continuous")
                    }
                }
                
            dummy_result = {
                "success": False,
                "message": f"Error running detection: {str(e)}",
                "alert_data": {
                    "type": aoi_data.get("alertType", "deforestation"),
                    "severity": "low",
                    "confidence": 0.5,
                    "description": "Fallback result due to script error",
                    "detectedChange": False,
                    **monitoring_info
                }
            }
            
            # Save the dummy result
            with open(args.output, 'w') as f:
                json.dump(dummy_result, f, indent=2)
            
            print("Created fallback result file due to error.")
        except Exception as inner_e:
            print(f"Failed to create fallback result: {inner_e}", file=sys.stderr)
        
        return 1

if __name__ == "__main__":
    sys.exit(main())
