import * as v from 'valibot';

const env_vars_schema = v.object({
    CF_ACC_ID: v.pipe(
        v.string(),
        v.nonEmpty()
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
            v.number(),
            v.minValue(1)
        )
    ),
    BUN_PUBLIC_MESSAGE_SIZE_LIMIT: v.optional(
        v.pipe(
            v.string(),
            v.toNumber(),
            v.number(),
            v.minValue(1)
        )
    ),
    RL_COUNT: v.optional(
        v.pipe(
            v.string(),
            v.toNumber(),
            v.number(),
            v.minValue(1)
        )
    ),
    RL_PERIOD: v.optional(
        v.pipe(
            v.string(),
            v.toNumber(),
            v.number(),
            v.minValue(1)
        )
    ),
    BAD_MESSAGES_LIMIT: v.optional(
        v.pipe(
            v.string(),
            v.toNumber(),
            v.number()
        )
    ),
    BAD_MESSAGES_BAN_PERIOD: v.optional(
        v.pipe(
            v.string(),
            v.toNumber(),
            v.number()
        )
    )
});

export { env_vars_schema };