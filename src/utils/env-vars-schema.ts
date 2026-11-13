import * as v from 'valibot';

const env_vars_schema = v.object({
    CF_ACC_ID: v.pipe(
        v.string(),
        v.nonEmpty(),
    ),
    CF_AI_API_KEY: v.pipe(
        v.string(),
        v.nonEmpty()
    ),
    REDIS_URL: v.pipe(
        v.string(),
        v.nonEmpty(),
        v.regex(/^rediss?:\/\//i, "Invalid Redis URL")
    ),
    IP_HASH_SECRET: v.pipe(
        v.string(),
        v.nonEmpty()
    ),
    MAX_MESSAGES: v.optional(
        v.pipe(
            v.string(),
            v.toNumber(),
            v.number(),
            v.safeInteger(),
            v.minValue(1)
        ),
        "30"
    ),
    BUN_PUBLIC_MESSAGE_SIZE_LIMIT: v.optional(
        v.pipe(
            v.string(),
            v.toNumber(),
            v.number(),
            v.safeInteger(),
            v.minValue(1)
        ),
        "400"
    ),
    RL_COUNT: v.optional(
        v.pipe(
            v.string(),
            v.toNumber(),
            v.number(),
            v.safeInteger(),
            v.minValue(1)
        ),
        "30"
    ),
    RL_PERIOD: v.optional(
        v.pipe(
            v.string(),
            v.toNumber(),
            v.number(),
            v.safeInteger(),
            v.minValue(1)
        ),
        "86400"
    ),
    BAD_MESSAGES_LIMIT: v.optional(
        v.pipe(
            v.string(),
            v.toNumber(),
            v.number(),
            v.safeInteger(),
            v.minValue(1)
        ),
        "3"
    ),
    BAD_MESSAGES_BAN_PERIOD: v.optional(
        v.pipe(
            v.string(),
            v.toNumber(),
            v.safeInteger(),
            v.minValue(1)
        ),
        "86400"
    ),
    BUN_PUBLIC_UMAMI_SCRIPT_URL: v.optional(
        v.pipe(
            v.string(),
            v.url()
        )
    ),
    BUN_PUBLIC_UMAMI_WEBSITE_ID: v.optional(
        v.string(),
    ),
});

export { env_vars_schema };