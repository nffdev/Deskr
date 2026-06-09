import LegalLayout from "@/components/legal/LegalLayout";

export default function Terms() {
    return (
        <LegalLayout title="Terms of Service" updatedAt="2026-06-09">
            <section>
                <h2 className="text-white font-medium mb-2">1. Purpose</h2>
                <p>These Terms govern the use of Deskr, a tool that lets users generate and operate remote-control clients.</p>
            </section>

            <section>
                <h2 className="text-white font-medium mb-2">2. Account</h2>
                <p>Registration requires a valid email address. Users are responsible for keeping their credentials confidential and for any activity performed from their account.</p>
            </section>

            <section>
                <h2 className="text-white font-medium mb-2">3. Permitted use</h2>
                <p>Deskr may only be used on machines the user owns or for which they have explicit authorization. Any malicious use, spying, or activity infringing on a third party's privacy is strictly prohibited.</p>
            </section>

            <section>
                <h2 className="text-white font-medium mb-2">4. Availability</h2>
                <p>The service is provided without any availability guarantee. The publisher may suspend or discontinue the service at any time, without notice.</p>
            </section>

            <section>
                <h2 className="text-white font-medium mb-2">5. Termination</h2>
                <p>Users may delete their account at any time. The publisher reserves the right to suspend any account that breaches these Terms.</p>
            </section>
        </LegalLayout>
    );
}
