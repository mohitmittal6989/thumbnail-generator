package com.thumblify;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.File;

@SpringBootApplication
public class ThumblifyApplication {

    public static void main(String[] args) {
        loadDotenv();
        SpringApplication.run(ThumblifyApplication.class, args);
    }

    public static void loadDotenv() {
        try {
            Dotenv dotenv = null;
            // Check current directory, then server directory, then parent directory
            if (new File(".env").exists()) {
                dotenv = Dotenv.configure().ignoreIfMissing().load();
            } else if (new File("server/.env").exists()) {
                dotenv = Dotenv.configure().directory("server").ignoreIfMissing().load();
            } else if (new File("../server/.env").exists()) {
                dotenv = Dotenv.configure().directory("../server").ignoreIfMissing().load();
            } else {
                dotenv = Dotenv.configure().ignoreIfMissing().load();
            }

            if (dotenv != null) {
                dotenv.entries().forEach(entry -> {
                    if (System.getProperty(entry.getKey()) == null) {
                        System.setProperty(entry.getKey(), entry.getValue());
                    }
                });
                System.out.println(">>> Loaded .env configuration successfully.");
            }
        } catch (Exception e) {
            System.err.println(">>> Warning: Could not load .env file: " + e.getMessage());
        }
    }
}
