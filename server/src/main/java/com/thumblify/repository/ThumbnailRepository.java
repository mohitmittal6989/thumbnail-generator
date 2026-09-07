package com.thumblify.repository;

import com.thumblify.model.Thumbnail;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ThumbnailRepository extends MongoRepository<Thumbnail, String> {
    List<Thumbnail> findByUserIdOrderByCreatedAtDesc(String userId);
    List<Thumbnail> findByVisibilityOrderByCreatedAtDesc(String visibility, Pageable pageable);
}
