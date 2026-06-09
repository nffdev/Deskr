import LegalLayout from "@/components/legal/LegalLayout";

export default function Notice() {
    return (
        <LegalLayout title="Legal Notice" updatedAt="2026-06-09">
            <section>
                <h2 className="text-white font-medium mb-2">Publisher</h2>
                <p>Deskr is published by an independent developer acting in a personal capacity.</p>
                <p>Contact: contact@deskr.org</p>
            </section>

            <section>
                <h2 className="text-white font-medium mb-2">Hosting</h2>
                <p>The website and its API are hosted by the provider chosen by the publisher. Contact details are available on request.</p>
            </section>

            <section>
                <h2 className="text-white font-medium mb-2">Intellectual property</h2>
                <p>All elements on Deskr (code, interface, logos, text) remain the property of their respective authors. Any unauthorized reproduction is prohibited.</p>
            </section>

            <section>
                <h2 className="text-white font-medium mb-2">Liability</h2>
                <p>Deskr is provided "as is", without warranty. The publisher cannot be held liable for misuse of the software or indirect damages.</p>
            </section>
        </LegalLayout>
    );
}
