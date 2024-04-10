from elasticsearch import Elasticsearch, RequestsHttpConnection
from requests_aws4auth import AWS4Auth
import boto3

#elastic
credential = boto3.Session(region_name="us-east-1").get_credentials()
auth = AWS4Auth(credential.access_key, credential.secret_key, 'us-east-1', 'es')
esEndPoint = 'search-photos-q64gsigljuzxiep5zdsaoahoay.us-east-1.es.amazonaws.com'

es = Elasticsearch(
        hosts = [{'host': esEndPoint, 'port': 443}],
        http_auth = auth,
        use_ssl = True,
        verify_certs = True,
        connection_class = RequestsHttpConnection
)
print(credential.access_key, credential.secret_key)