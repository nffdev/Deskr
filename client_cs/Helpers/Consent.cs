using System;
using System.Drawing;
using System.Windows.Forms;

namespace client.Helpers
{
    public static class Consent
    {
        public static bool ShowConsentDialog()
        {
            bool accepted = false;

            var form = new Form
            {
                Text            = "Deskr - Consent required",
                Size            = new Size(480, 285),
                FormBorderStyle = FormBorderStyle.FixedDialog,
                MaximizeBox     = false,
                MinimizeBox     = false,
                StartPosition   = FormStartPosition.CenterScreen,
                TopMost         = true
            };

            var lblTitle = new Label
            {
                Text     = "Warning - Remote Control",
                Location = new Point(60, 18),
                Size     = new Size(400, 24),
                Font     = new Font(SystemFonts.DefaultFont, FontStyle.Regular)
            };

            var lblDesc = new Label
            {
                Text     = "By installing and running this program, you allow\r\n" +
                           "a remote person to connect to and control this\r\n" +
                           "computer remotely.\r\n\r\n" +
                           "This action is active as long as the program is running.",
                Location = new Point(20, 55),
                Size     = new Size(420, 100)
            };

            var chk = new CheckBox
            {
                Text     = "I understand and accept remote control of this computer",
                Location = new Point(20, 165),
                Size     = new Size(420, 22)
            };

            var btnAccept = new Button
            {
                Text     = "Accept and install",
                Location = new Point(200, 205),
                Size     = new Size(160, 30),
                Enabled  = false
            };

            var btnCancel = new Button
            {
                Text     = "Cancel",
                Location = new Point(370, 205),
                Size     = new Size(80, 30)
            };

            chk.CheckedChanged += (s, e) => btnAccept.Enabled = chk.Checked;

            btnAccept.Click += (s, e) =>
            {
                accepted = true;
                form.Close();
            };

            btnCancel.Click += (s, e) => form.Close();

            form.Controls.AddRange(new Control[] { lblTitle, lblDesc, chk, btnAccept, btnCancel });
            form.ShowDialog();

            return accepted;
        }
    }
}
