import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { Injectable } from '@nestjs/common';

@Injectable()
export class DynamodbService {

    private readonly dynamoClient: DynamoDBDocumentClient;

    constructor(){
        const client = new DynamoDBClient({
            region: process.env.AWS_REGION,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            }
        })
        this.dynamoClient = DynamoDBDocumentClient.from(client);
    }

    get dynamoCliente(){
        return this.dynamoClient
    }

}
