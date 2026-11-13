import { useEffect } from "react";

export default function UmamiAnalytics() {
    useEffect(() => {
        try {
            const umami_site_id = process.env.BUN_PUBLIC_UMAMI_WEBSITE_ID;
            const umami_script_url = process.env.BUN_PUBLIC_UMAMI_SCRIPT_URL;

            // Only add analytics when the required environment variables are present
            if (umami_site_id && umami_script_url) {
                const analytics_script = document.createElement('script');
                analytics_script.src = umami_script_url;
                analytics_script.setAttribute('data-website-id', umami_site_id);
                analytics_script.defer = true;
                document.head.appendChild(analytics_script);
            }
        } catch (e) {
            // Ignore this kind of error because it simply means the analytics env variables are not present
            if ((e as { message: string }).message !== 'process is not defined') {
                console.error(e);
            }
        }
    }, []);
    return null;
}