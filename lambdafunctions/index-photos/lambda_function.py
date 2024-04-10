import json
import boto3
import datetime
from elasticsearch import Elasticsearch,RequestsHttpConnection
from requests_aws4auth import AWS4Auth


def lambda_handler(event, context):
    filenameInput = event["Records"][0]['s3']['object']['key']

    # Format filename (remove spaces)
    filename = ''.join([c for c in filenameInput if c != ' '])
    print("FILENAME", filename)
    
    BUCKET_NAME = "photoalbum-assignment-wzxcm-b2"
    region = 'us-east-1'
    json_object = {
        "objectKey": filename,
        "bucket": BUCKET_NAME,
        "createdTimestamp": datetime.datetime.now().isoformat(),
        "labels": [
         ]
    }

    s3 = boto3.client('s3')
    metadata = s3.head_object(Bucket=BUCKET_NAME, Key=filename)
    print("METADATA", metadata)
    

    # Extract labels using Rekognition
    client=boto3.client('rekognition', region)
    response = client.detect_labels(Image={'S3Object':{'Bucket':BUCKET_NAME,'Name':filename}},
            MaxLabels=10, MinConfidence=80)
    print("REKOGNITION RESPONSE", response)

    for label in response['Labels']:
        json_object['labels'].append(label['Name'])
        print ("Label: " + label['Name'])
    # https://docs.aws.amazon.com/rekognition/latest/dg/labels-detect-labels-image.html


    # Extract custom labels and add them to json object
    if metadata and 'x-amz-meta-customlabels' in metadata['ResponseMetadata']['HTTPHeaders']:
        customLabels = metadata['ResponseMetadata']['HTTPHeaders']['x-amz-meta-customlabels']
        customLabelsArr = [x.strip() for x in customLabels.split(',')]
        print('custom labels', customLabelsArr)
        for i in customLabelsArr:
            json_object['labels'].append(i)
    # https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/s3.html
    # json_object['labels'].append('cat')


    # ElasticSearch auth
    service = 'es'
    credentials = boto3.Session().get_credentials()
    host = 'search-photos-q64gsigljuzxiep5zdsaoahoay.us-east-1.es.amazonaws.com'
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

    print('json', json_object)

    # Add to ElasticSearch
    # If using filename as the ID, different files cant have the same filename (so excluding id parameter so elasticsearch can auto generate it)
    res = es.index(index="photos", doc_type="Photo", body=json.dumps(json_object))
    print("RESULT", res['result'])

    return {
        'statusCode': 200,
        # 'body': json.dumps('Hello from Lambda!')
    }  