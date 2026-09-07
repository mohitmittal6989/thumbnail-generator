package com.thumblify.config;

import com.mongodb.ConnectionString;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.SimpleMongoClientDatabaseFactory;

@Configuration
public class MongoConfig {

    @Value("${spring.data.mongodb.uri:${MONGO_URI:mongodb://127.0.0.1:27017/thumblify}}")
    private String mongoUri;

    @Bean
    public MongoDatabaseFactory mongoDatabaseFactory() {
        String uri = mongoUri != null && !mongoUri.trim().isEmpty() ? mongoUri.trim() : "mongodb://127.0.0.1:27017/thumblify";
        ConnectionString connectionString = new ConnectionString(uri);

        String databaseName = connectionString.getDatabase();
        if (databaseName == null || databaseName.trim().isEmpty()) {
            databaseName = "thumblify";
        }

        MongoClient mongoClient = MongoClients.create(connectionString);
        return new SimpleMongoClientDatabaseFactory(mongoClient, databaseName);
    }

    @Bean
    public MongoTemplate mongoTemplate(MongoDatabaseFactory mongoDatabaseFactory) {
        return new MongoTemplate(mongoDatabaseFactory);
    }
}
