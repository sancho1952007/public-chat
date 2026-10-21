const violations = {
    profanity: "Curse words, obscene anatomical references, or vulgar language present in content.",
    spam: "Unsolicited commercial advertising or crypto schemes.",
    harassment: "Direct personal attacks, severe bullying, malicious mocking, or targeted abuse toward an individual.",
    threat: "Explicit statements of physical violence, bodily harm, property destruction, or doxxing.",
    sexual_content: "Explicit descriptions of sexual acts, graphic fetishes, or highly provocative NSFW language.",
    hate_speech: "Slurs, systemic hate speech, dehumanizing language, or discrimination based on race, gender, religion, or sexuality.",
    url: "Hyperlinks URL, domain, subdomain, masked domains, IP addresses, or text engineered to bypass link filters (e.g., example [dot] com).",
    none: "The message is completely safe, normal conversational text, constructive feedback, or benign context.",
} as const;

export async function Moderate(text: string): Promise<{
    allowed: true
} | {
    allowed: false,
    violation: string
}> {
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${Bun.env.CF_ACC_ID}/ai/run/@cf/cloudflare/clef-flash`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${Bun.env.CF_AI_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "clef-flash",
            state: text,
            questions: {
                moderation: {
                    type: "choice",
                    instructions: "Analyze the text for safety violations, including minor spelling obfuscations or formatting tricks to evaluate the core semantic meaning.",
                    criteria: violations,
                },
            },
        }),
    });

    if (!response.ok) {
        throw new Error(`CF API error: ${response.status} ${await response.text()}`);
    }

    const res = await response.json();
    if (res.result.answers.moderation.choice == 'none') {
        return {
            allowed: true
        }
    } else {
        const violationKey = res.result?.answers?.moderation?.choice;

        return {
            allowed: false,
            // replace _ with space in the error message
            violation: violationKey.replace('_', ' ')
        };
    }
}
