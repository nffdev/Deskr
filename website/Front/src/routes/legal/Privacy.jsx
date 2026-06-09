import LegalLayout from "@/components/legal/LegalLayout";

export default function Privacy() {
    return (
        <LegalLayout title="Privacy Policy (GDPR)" updatedAt="2026-06-09">
            <section>
                <h2 className="text-white font-medium mb-2">Data collected</h2>
                <p>Deskr only collects data required to operate: username, email, hashed password, and connection metadata (IP address, machine identifier, timestamps) tied to the account that built the client.</p>
            </section>

            <section>
                <h2 className="text-white font-medium mb-2">Purposes</h2>
                <p>Data is used to authenticate the user, bind each client to its owner, and enable remote control of authorized machines.</p>
            </section>

            <section>
                <h2 className="text-white font-medium mb-2">Legal basis</h2>
                <p>Processing is based on the performance of the service requested by the user and on the consent given at account creation.</p>
            </section>

            <section>
                <h2 className="text-white font-medium mb-2">Retention</h2>
                <p>Account data is kept for as long as the account exists. Connection records are deleted after a reasonable retention period or upon request.</p>
            </section>

            <section>
                <h2 className="text-white font-medium mb-2">Your rights</h2>
                <p>Under the GDPR you have the right to access, rectify, erase, port, and object to the processing of your data. To exercise these rights, contact: contact@deskr.org.</p>
            </section>

            <section>
                <h2 className="text-white font-medium mb-2">Cookies</h2>
                <p>Deskr only uses local storage (localStorage) to keep the authentication token. No advertising or tracking cookies are used.</p>
            </section>
        </LegalLayout>
    );
}
