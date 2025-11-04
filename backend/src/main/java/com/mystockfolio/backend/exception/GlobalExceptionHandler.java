package com.mystockfolio.backend.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.util.HashMap;
import java.util.Map;

@ControllerAdvice // 모든 @Controller 에서 발생하는 예외를 처리
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // @Valid 유효성 검사 실패 시 (MethodArgumentNotValidException)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST) // 400 Bad Request 반환
    public ResponseEntity<Map<String, String>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
            log.warn("Validation error - Field: {}, Message: {}", fieldName, errorMessage); // 로그 추가
        });
        return ResponseEntity.badRequest().body(errors);
    }

    // 이메일 중복 시 (DuplicateResourceException)
    @ExceptionHandler(DuplicateResourceException.class)
    @ResponseStatus(HttpStatus.CONFLICT) // 409 Conflict 반환
    public ResponseEntity<Map<String, String>> handleDuplicateResourceException(DuplicateResourceException ex) {
        Map<String, String> error = Map.of("error", ex.getMessage());
        log.warn("Duplicate resource error: {}", ex.getMessage()); // 로그 추가
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    // 비밀번호 불일치 등 (IllegalArgumentException) - 좀 더 구체적인 예외 클래스를 만드는 것이 좋음
    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST) // 400 Bad Request 반환
    public ResponseEntity<Map<String, String>> handleIllegalArgumentException(IllegalArgumentException ex) {
        Map<String, String> error = Map.of("error", ex.getMessage());
        log.warn("Illegal argument error: {}", ex.getMessage()); // 로그 추가
        return ResponseEntity.badRequest().body(error);
    }

    // 로그인 실패 시 (InvalidCredentialsException)
    @ExceptionHandler(InvalidCredentialsException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED) // 401 Unauthorized 반환
    public ResponseEntity<Map<String, String>> handleInvalidCredentialsException(InvalidCredentialsException ex) {
        Map<String, String> error = Map.of("error", ex.getMessage());
        log.warn("Invalid credentials error: {}", ex.getMessage()); // 로그 추가
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    // 리소스 찾기 실패 시 (ResourceNotFoundException)
    @ExceptionHandler(ResourceNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND) // 404 Not Found 반환
    public ResponseEntity<Map<String, String>> handleResourceNotFoundException(ResourceNotFoundException ex) {
        Map<String, String> error = Map.of("error", ex.getMessage());
        log.warn("Resource not found error: {}", ex.getMessage()); // 로그 추가
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    // 접근 권한 없음 (Forbidden)
    @ExceptionHandler(ForbiddenException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ResponseEntity<Map<String, String>> handleForbiddenException(ForbiddenException ex) {
        Map<String, String> error = Map.of("error", ex.getMessage());
        log.warn("Forbidden: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }


    // 그 외 예상치 못한 모든 예외 (Exception)
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR) // 500 Internal Server Error 반환
    public ResponseEntity<Map<String, String>> handleAllUncaughtException(Exception ex) {
        log.error("Unhandled exception occurred", ex); // 스택 트레이스를 포함한 에러 로그
        Map<String, String> error = Map.of("error", "서버 내부 오류가 발생했습니다. 관리자에게 문의하세요.");
        return ResponseEntity.internalServerError().body(error);
    }
}