---
description: Always use MapStruct mappers for entity↔DTO conversion, never manual builder calls in service
---

# Mapper Convention

## Rule
**ALL entity ↔ DTO conversions MUST go through a MapStruct mapper interface.**  
Never write manual `.builder()` mapping in the service layer.

## How

1. For each module (e.g., Attempt, Quiz, Question), there should be a **dedicated mapper** in `com.quizmaster.mapper`.

2. The mapper interface must use:
   ```java
   @Mapper(componentModel = "spring")
   public interface XyzMapper { ... }
   ```

3. **Entity → DTO**: Use `@Mapping` annotations for field-name mismatches. Use `expression` for computed fields (e.g., UUID → String).

4. **DTO → Entity**: Use `@Mapping(target = "...", ignore = true)` for fields set by the service (e.g., `id`, `attempt`, `isCorrect`).

5. **Update existing entity**: Use `@BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)` with `@MappingTarget`.

6. **Computed fields**: Use `@AfterMapping` with `@MappingTarget` for fields that need post-processing (e.g., `timeTakenSeconds`, `isSkipped`).

7. **Multi-source mappings**: Use `default` methods in the mapper that delegate to annotated methods.

## Inject into Service
```java
private final XyzMapper xyzMapper;
```

## Do NOT
- Write `SomeResponse.builder().field(entity.getField())...build()` in service methods.
- Manually convert entity fields → DTO fields in service code.
- Duplicate mapping logic across services.
