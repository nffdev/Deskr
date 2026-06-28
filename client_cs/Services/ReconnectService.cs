using System;
using System.Threading;

namespace client.Services
{
    public class ReconnectService
    {
        public const int MAX_ATTEMPTS  = 10;
        public const int BASE_DELAY_MS = 500;
        public const int MAX_DELAY_MS  = 30000;

        private readonly Func<bool> _connectFn;
        private volatile bool       _running;
        private Thread              _thread;

        public ReconnectService(Func<bool> connectFn)
        {
            _connectFn = connectFn;
            _running   = false;
        }

        public void TriggerReconnect()
        {
            if (_running) return;
            _running = true;
            _thread  = new Thread(Run) { IsBackground = true };
            _thread.Start();
        }

        public void Stop()
        {
            _running = false;
            if (_thread != null && _thread.IsAlive)
                _thread.Join(TimeSpan.FromSeconds(5));
        }

        private void Run()
        {
            int attempt = 0;
            int delayMs = BASE_DELAY_MS;

            while (_running && attempt < MAX_ATTEMPTS)
            {
                ++attempt;
                Console.WriteLine($"[reconnecting... attempt {attempt}/{MAX_ATTEMPTS}]");
                Thread.Sleep(delayMs);

                if (!_running) return;

                if (_connectFn())
                {
                    Console.WriteLine("[connected] Reconnected successfully.");
                    _running = false;
                    return;
                }

                delayMs = Math.Min(delayMs * 2, MAX_DELAY_MS);
            }

            if (_running)
                Console.WriteLine("[disconnected] Max reconnection attempts reached.");

            _running = false;
        }
    }
}
