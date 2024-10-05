import json
import sys
import io
import os
import subprocess

from contextlib import redirect_stdout


# STDOUT redirection reused from: https://stackoverflow.com/questions/16571150/how-to-capture-stdout-output-from-a-python-function-call
sys.path.append('/tmp')
os.chdir('/tmp')

def handler(event, context):
    if "language" in event and 'code' in event:
        language = event['language'].strip().lower()
        out = io.StringIO()
        
        if language == 'python':
            __write_to_file(event['code'], 'script.py')

            try:
                from script import Solution

                with redirect_stdout(out):
                    soln = Solution().main()

                return {
                    'statusCode': 200,
                    'description': 'Success',
                    'results': [soln],
                    'prints': [out.getvalue()] if len(out.getvalue()) > 0 else [],
                    'errors': [],
                    'details': {
                        'arn': context.invoked_function_arn,
                        'request_id': context.aws_request_id,
                        'log_group_name': context.log_group_name,
                        'log_stream_name': context.log_stream_name,
                    }
                }
            except ImportError as ex:
                return {
                    'statusCode': 400,
                    'description': 'Import Error',
                    'results': [],
                    'prints': [out.getvalue()] if len(out.getvalue()) > 0 else [],
                    'errors': [str(ex)],
                    'details': {
                        'arn': context.invoked_function_arn,
                        'request_id': context.aws_request_id,
                        'log_group_name': context.log_group_name,
                        'log_stream_name': context.log_stream_name,
                    }
                }
            except Exception as ex:
                return {
                    'statusCode': 400,
                    'description': 'Runtime Error',
                    'results': [],
                    'prints': [out.getvalue()] if len(out.getvalue()) > 0 else [],
                    'errors': [str(ex)],
                    'details': {
                        'arn': context.invoked_function_arn,
                        'request_id': context.aws_request_id,
                        'log_group_name': context.log_group_name,
                        'log_stream_name': context.log_stream_name,
                    }
                }
        elif language == 'cpp':
            __write_to_file(event['code'], 'script.cpp')
            results = subprocess.run(['g++', 'script.cpp'], capture_output=True, text=True)
            if results.returncode != 0:
                return {
                    'statusCode': 400,
                    'description': 'Compilation or Runtime Error',
                    'results': [results.stdout],
                    'prints': [results.stdout],
                    'errors': [results.stderr],
                    'details': {
                        'arn': context.invoked_function_arn,
                        'request_id': context.aws_request_id,
                        'log_group_name': context.log_group_name,
                        'log_stream_name': context.log_stream_name,
                    }
                }
            else:
                results = subprocess.run(['./a.out'], capture_output=True, text=True)
                return {
                    'statusCode': 200 if not results.stderr else 400,
                    'description': 'Success' if not results.stderr else "Runtime Error",
                    'results': [results.stdout],
                    'prints': [results.stdout],
                    'errors': [results.stderr],
                    'details': {
                        'arn': context.invoked_function_arn,
                        'request_id': context.aws_request_id,
                        'log_group_name': context.log_group_name,
                        'log_stream_name': context.log_stream_name,
                    }
                }
    else:
        return {
            'statusCode': 400,
            'description': 'No Language or Code Specified',
            'results': [],
            'prints': [],
            'errors': ["Missing langauge or code parameter"],
            'details': {
                'arn': context.invoked_function_arn,
                'request_id': context.aws_request_id,
                'log_group_name': context.log_group_name,
                'log_stream_name': context.log_stream_name,
            }
        }
    
def __write_to_file(code, filename):
    """
    Writes the input string into a code file.

    Args:
        code (string): String representing the code to write
        filename (string): Name of the file to write the code string into
    """
    
    with open(filename, 'w') as f:
        for line in code.split("\n"):
            f.write(line)
            f.write("\n")
