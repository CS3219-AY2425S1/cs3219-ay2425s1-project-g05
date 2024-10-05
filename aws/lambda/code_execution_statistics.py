import json
import boto3
import time
import re

def lambda_handler(event, context):
    returns = {
        'statusCode': event['statusCode'],
        'description': event['description'],
        'results': event['results'],
        'prints': event['prints'],
        'errors': event['errors'],
        'time': 0,
        'memory': 0,
    }
    
    lambda_request_id = event['details']['request_id']
    log_group_name = event['details']['log_group_name']
    log_stream_name = event['details']['log_stream_name']
    
    cloudwatch = boto3.client('logs')
    events = cloudwatch.get_log_events(
        logGroupName=log_group_name,
        logStreamName=log_stream_name,
    )
    
    for event in events['events']:
        current_log_message = event['message']
        
        if not current_log_message.startswith('REPORT'):
            continue
        
        run_id = re.search(f'RequestId: {lambda_request_id}', current_log_message)
        
        if not run_id:
            continue
        
        memory = re.search(r'Max Memory Used: (\d+) MB', current_log_message)
        runtime = re.search(r'Duration: ([\d\.]+) ms', current_log_message)
    
        if memory and runtime:
            returns["time"] = float(runtime.group(1))
            returns["memory"] = float(memory.group(1))
            break        

    return returns
