#!/usr/bin/env python
"""
Direct detection script that avoids path issues

This script acts as a simplified entry point for the change detection system,
helping to avoid path issues when called from Next.js
"""

import os
import sys
import json
import traceback

def main():
    """Main function to run the script"""
    # Print diagnostics
    print(f"Python executable: {sys.executable}")
    print(f"Python version: {sys.version}")
    print(f"Working directory: {os.getcwd()}")
    print(f"Script arguments: {sys.argv}")
    
    # Check if we have enough arguments
    if len(sys.argv) < 3:
        print("Error: Not enough arguments. Usage: direct_detection.py input_file output_file")
        return 1
        
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    debug_mode = "--debug" in sys.argv
    
    print(f"Input file: {input_file}")
    print(f"Output file: {output_file}")
    print(f"Debug mode: {debug_mode}")
    
    # Check if input file exists
    if not os.path.exists(input_file):
        print(f"Error: Input file does not exist: {input_file}")
        return 1
        
    try:
        # Try to read the input file
        with open(input_file, 'r') as f:
            aoi_data = json.load(f)
            print(f"Successfully read input file. AOI type: {aoi_data.get('alertType', 'unknown')}")
        
        # Create a dummy result for now - this would call the actual ML code in production
        result = {
            "success": True,
            "message": "Detection completed successfully",
            "alert_data": {
                "type": aoi_data.get("alertType", "deforestation"),
                "severity": "medium",
                "confidence": 0.85,
                "description": f"Change detected in {aoi_data.get('aoi_id', 'unknown')}",
                "detectedChange": True,
                "images": {
                    "before": "placeholder_before.jpg",
                    "after": "placeholder_after.jpg",
                    "change": "placeholder_change.jpg"
                }
            }
        }
        
        # Write output to the specified file
        with open(output_file, 'w') as f:
            json.dump(result, f)
        
        print(f"Successfully wrote results to {output_file}")
        return 0
    except Exception as e:
        print(f"Error in direct detection script: {e}")
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())
