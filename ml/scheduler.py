#!/usr/bin/env python
"""
Change Detection Scheduler Script

This script processes multiple AOIs in batch mode, useful for scheduled monitoring
of all active AOIs in the system.
"""

import os
import sys
import json
import time
import argparse
import datetime
from typing import List, Dict, Any
from change_detection_system import ChangeDetectionSystem

def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Run batch change detection on multiple AOIs')
    parser.add_argument('--input', '-i', required=True, help='Path to input JSON file with list of AOIs')
    parser.add_argument('--output-dir', '-o', required=True, help='Directory to save output JSON files')
    parser.add_argument('--config', '-c', help='Path to optional configuration file')
    parser.add_argument('--threads', '-t', type=int, default=1, help='Number of threads to use (default: 1)')
    parser.add_argument('--continuous', action='store_true', help='Run in continuous monitoring mode')
    parser.add_argument('--interval', type=int, default=86400, help='Interval in seconds between runs in continuous mode (default: 86400 - 1 day)')
    return parser.parse_args()

def process_aoi(change_system: ChangeDetectionSystem, aoi_data: Dict[str, Any], output_dir: str) -> Dict[str, Any]:
    """Process a single AOI and save results."""
    try:
        # Process the AOI
        print(f"Processing AOI: {aoi_data.get('aoi_id', 'unknown')}")
        results = change_system.process_aoi(aoi_data)
        
        # Remove maps from results (can't easily serialize EE objects)
        if 'change_maps' in results:
            results['change_maps'] = {
                'status': 'generated',
                'description': 'Maps were generated but removed from JSON output'
            }
        
        # Save results to output file
        output_file = os.path.join(output_dir, f"{aoi_data.get('aoi_id', f'unknown_{int(time.time())}')}_result.json")
        os.makedirs(os.path.dirname(os.path.abspath(output_file)), exist_ok=True)
        
        with open(output_file, 'w') as f:
            json.dump(results, f, indent=2)
        
        print(f"Results saved to: {output_file}")
        
        return {
            'aoi_id': aoi_data.get('aoi_id', 'unknown'),
            'status': 'success',
            'output_file': output_file,
            'alert_data': results.get('alert_data', {})
        }
    
    except Exception as e:
        print(f"Error processing AOI {aoi_data.get('aoi_id', 'unknown')}: {e}")
        
        # Save error to output file
        output_file = os.path.join(output_dir, f"{aoi_data.get('aoi_id', f'unknown_{int(time.time())}')}_error.json")
        os.makedirs(os.path.dirname(os.path.abspath(output_file)), exist_ok=True)
        
        with open(output_file, 'w') as f:
            json.dump({
                'aoi_id': aoi_data.get('aoi_id', 'unknown'),
                'error': str(e),
                'status': 'failed',
                'timestamp': datetime.datetime.now().isoformat()
            }, f, indent=2)
        
        return {
            'aoi_id': aoi_data.get('aoi_id', 'unknown'),
            'status': 'failed',
            'error': str(e),
            'output_file': output_file
        }

def process_aois_sequential(change_system: ChangeDetectionSystem, aois: List[Dict[str, Any]], output_dir: str) -> List[Dict[str, Any]]:
    """Process AOIs sequentially."""
    results = []
    
    for aoi_data in aois:
        result = process_aoi(change_system, aoi_data, output_dir)
        results.append(result)
    
    return results

def process_aois_parallel(change_system: ChangeDetectionSystem, aois: List[Dict[str, Any]], output_dir: str, num_threads: int) -> List[Dict[str, Any]]:
    """Process AOIs in parallel using multiple threads."""
    # This requires additional libraries like concurrent.futures
    # For simplicity in this example, we'll just call the sequential version
    print(f"Parallel processing with {num_threads} threads requested, but not implemented.")
    print("Falling back to sequential processing.")
    return process_aois_sequential(change_system, aois, output_dir)

def main():
    """Main entry point for the script."""
    args = parse_args()
    
    # Check if input file exists
    if not os.path.exists(args.input):
        print(f"Error: Input file not found: {args.input}")
        return 1
    
    # Load AOI data
    try:
        with open(args.input, 'r') as f:
            aoi_list = json.load(f)
            
        if not isinstance(aoi_list, list):
            print("Error: Input file must contain a JSON array of AOI objects")
            return 1
    except (json.JSONDecodeError, IOError) as e:
        print(f"Error loading AOI data: {e}")
        return 1
    
    # Create output directory if it doesn't exist
    os.makedirs(args.output_dir, exist_ok=True)
    
    # Initialize change detection system
    config_path = args.config if args.config and os.path.exists(args.config) else None
    change_system = ChangeDetectionSystem(config_path=config_path)
    
    # Define function to run a single processing cycle
    def run_processing_cycle():
        start_time = time.time()
        print(f"Starting batch processing of {len(aoi_list)} AOIs at {datetime.datetime.now().isoformat()}")
        
        # For continuous monitoring, reload the AOI list each time
        # In a real production system, this would query the database directly
        if args.continuous:
            try:
                with open(args.input, 'r') as f:
                    updated_aoi_list = json.load(f)
                    
                if isinstance(updated_aoi_list, list):
                    nonlocal aoi_list
                    aoi_list = updated_aoi_list
                    print(f"Reloaded {len(aoi_list)} AOIs from input file")
            except Exception as e:
                print(f"Warning: Failed to reload AOI list: {e}")
                print("Continuing with previous AOI list")
        
        if args.threads > 1:
            results = process_aois_parallel(change_system, aoi_list, args.output_dir, args.threads)
        else:
            results = process_aois_sequential(change_system, aoi_list, args.output_dir)
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Generate summary
        success_count = sum(1 for r in results if r['status'] == 'success')
        failure_count = len(results) - success_count
        
        print(f"\nBatch processing completed in {duration:.2f} seconds")
        print(f"Processed {len(results)} AOIs: {success_count} succeeded, {failure_count} failed")
        
        # Save summary report
        timestamp = int(time.time())
        summary_file = os.path.join(args.output_dir, f"batch_summary_{timestamp}.json")
        with open(summary_file, 'w') as f:
            json.dump({
                'timestamp': datetime.datetime.now().isoformat(),
                'total_aois': len(results),
                'success_count': success_count,
                'failure_count': failure_count,
                'duration_seconds': duration,
                'results': results
            }, f, indent=2)
        
        print(f"Summary report saved to: {summary_file}")
        return timestamp, success_count, failure_count
    
    # Run once or in continuous mode
    if args.continuous:
        print(f"Starting continuous monitoring mode with interval of {args.interval} seconds")
        try:
            while True:
                timestamp, success_count, failure_count = run_processing_cycle()
                
                # Log continuous run
                with open(os.path.join(args.output_dir, "continuous_log.json"), 'a') as f:
                    f.write(json.dumps({
                        'run_timestamp': timestamp,
                        'time': datetime.datetime.now().isoformat(),
                        'success': success_count,
                        'failures': failure_count
                    }) + "\n")
                
                print(f"Sleeping for {args.interval} seconds until next run...")
                time.sleep(args.interval)
        except KeyboardInterrupt:
            print("Continuous monitoring stopped by user")
            return 0
    else:
        # Run once
        run_processing_cycle()
        return 0

if __name__ == "__main__":
    sys.exit(main())
