package com.quizmaster.mapper;

import com.quizmaster.dto.response.NotificationResponse;
import com.quizmaster.entity.Notification;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface NotificationMapper {

    @Mapping(source = "uuid", target = "uuid")
    @Mapping(source = "type", target = "type")   // enum → String via name()
    @Mapping(source = "title", target = "title")
    @Mapping(source = "message", target = "message")
    @Mapping(source = "actionUrl", target = "actionUrl")
    @Mapping(source = "isRead", target = "isRead")
    @Mapping(source = "readAt", target = "readAt")
    @Mapping(source = "createdAt", target = "createdAt")
    @Mapping(source = "referenceUuid",   target = "referenceUuid")
    @Mapping(source = "referenceType", target = "referenceType")
    NotificationResponse toResponse(Notification notification);
}
