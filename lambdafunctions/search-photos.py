import json
import time
import os
import boto3
from elasticsearch import Elasticsearch, RequestsHttpConnection
from requests_aws4auth import AWS4Auth


def lambda_handler(event, context):
    """
    Route the incoming request based on intent.
    The JSON body of the request is provided in the event slot.
    """
    # By default, treat the user request as coming from the America/New_York time zone.
    os.environ['TZ'] = 'America/New_York'
    time.tzset()
    print('event', event)
    
    text = event['queryStringParameters']['q']
    print('TEXT', text)

    # Call Lex Chatbot
    client = boto3.client('lex-runtime')
    response = client.post_text(
        botName='search',
        botAlias='prod',
        userId='user',
        inputText=text #send user input to lex chatbot
    )

    print("RESPONSE FROM LEX", response)

    # Handle invalid user searches
    if 'slots' not in response or 'labelOne' not in response['slots'] or response['slots']['labelOne'] is None:
        return {
            "statusCode": 200,
            'headers': {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps([])
        }


    # Extract labels
    first_label = response['slots']['labelOne']
    second_label = response['slots']['labelTwo']

    print("FIRST LABEL", first_label)
    print("SECOND LABEL", second_label)

    labels_to_check = [first_label]
    if second_label:
        labels_to_check.append(second_label)
    print("LABELS TO CHECK", labels_to_check)


    # ElasticSearch auth
    service = 'es'
    region = 'us-east-1'
    host = 'search-photos-q64gsigljuzxiep5zdsaoahoay.us-east-1.es.amazonaws.com'
    credentials = boto3.Session().get_credentials()
    awsauth = AWS4Auth(credentials.access_key, credentials.secret_key, region, service, session_token=credentials.token)

    # Connect to ElasticSearch
    es = Elasticsearch(
        hosts = [{'host': host, 'port': 443}],
        http_auth = awsauth,
        use_ssl = True,
        verify_certs = True,
        connection_class=RequestsHttpConnection,
    )
    # https://docs.aws.amazon.com/elasticsearch-service/latest/developerguide/es-request-signing.html#es-request-signing-python


    searchresults = []
    
    # Search function
    def elasticsearch_helper(labelname):
        search_res = es.search(index="photos", body={"query": {"match": {'labels': labelname}}})
        print(search_res)
        for hit in search_res['hits']['hits']:
            searchresults.append(hit['_source']['objectKey'])
    # https://elasticsearch-py.readthedocs.io/en/v7.11.0/
    
    # Get results
    for i in labels_to_check:
        elasticsearch_helper(i)
    # Remove duplicate files
    unique_results = list(set(searchresults))
    print("UNIQUE RESULTS", unique_results)


    return {
        "statusCode": 200,
        'headers': {"Access-Control-Allow-Origin": "*"},
        "body": json.dumps(unique_results)
        # "isBase64Encoded": true|false,
    }