#pragma once
#include <Windows.h>
#include <string>

namespace Consent {

    static bool  s_checked  = false;
    static bool  s_accepted = false;
    static HWND  s_btnAccept = NULL;

    static const int ID_CHECKBOX = 101;
    static const int ID_BTN_ACCEPT = 102;
    static const int ID_BTN_CANCEL = 103;

    static LRESULT CALLBACK WndProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam) {
        switch (msg) {
            case WM_CREATE: {
                HICON hIcon = LoadIconW(NULL, IDI_WARNING);
                SendMessageW(hwnd, WM_SETICON, ICON_BIG, (LPARAM)hIcon);

                CreateWindowExW(
                    0, L"STATIC", NULL, WS_CHILD | WS_VISIBLE | SS_LEFT,
                    20, 20, 420, 20, hwnd, NULL, NULL, NULL
                );
                CreateWindowExW(
                    0, L"STATIC",
                    L"Warning - Remote Control",
                    WS_CHILD | WS_VISIBLE | SS_LEFT,
                    60, 18, 400, 24, hwnd, NULL, NULL, NULL
                );

                CreateWindowExW(
                    0, L"STATIC",
                    L"By installing and running this program, you allow\r\n"
                    L"a remote person to connect to and control this\r\n"
                    L"computer remotely.\r\n\r\n"
                    L"This action is active as long as the program is running.",
                    WS_CHILD | WS_VISIBLE | SS_LEFT,
                    20, 55, 420, 100, hwnd, NULL, NULL, NULL
                );

                CreateWindowExW(
                    0, L"BUTTON",
                    L"I understand and accept remote control of this computer",
                    WS_CHILD | WS_VISIBLE | BS_CHECKBOX | BS_AUTOCHECKBOX,
                    20, 165, 420, 22, hwnd, (HMENU)ID_CHECKBOX, NULL, NULL
                );

                s_btnAccept = CreateWindowExW(
                    0, L"BUTTON", L"Accept and install",
                    WS_CHILD | WS_VISIBLE | BS_DEFPUSHBUTTON | WS_DISABLED,
                    200, 205, 160, 30, hwnd, (HMENU)ID_BTN_ACCEPT, NULL, NULL
                );

                CreateWindowExW(
                    0, L"BUTTON", L"Cancel",
                    WS_CHILD | WS_VISIBLE | BS_PUSHBUTTON,
                    370, 205, 80, 30, hwnd, (HMENU)ID_BTN_CANCEL, NULL, NULL
                );

                return 0;
            }

            case WM_COMMAND: {
                int id = LOWORD(wParam);

                if (id == ID_CHECKBOX) {
                    s_checked = (SendDlgItemMessageW(hwnd, ID_CHECKBOX, BM_GETCHECK, 0, 0) == BST_CHECKED);
                    EnableWindow(s_btnAccept, s_checked ? TRUE : FALSE);
                }
                else if (id == ID_BTN_ACCEPT && s_checked) {
                    s_accepted = true;
                    DestroyWindow(hwnd);
                }
                else if (id == ID_BTN_CANCEL) {
                    s_accepted = false;
                    DestroyWindow(hwnd);
                }
                return 0;
            }

            case WM_CLOSE:
                s_accepted = false;
                DestroyWindow(hwnd);
                return 0;

            case WM_DESTROY:
                PostQuitMessage(0);
                return 0;

            default:
                return DefWindowProcW(hwnd, msg, wParam, lParam);
        }
    }

    inline bool ShowConsentDialog() {
        s_checked  = false;
        s_accepted = false;
        s_btnAccept = NULL;

        const wchar_t* CLASS_NAME = L"DeskrConsentWindow";

        WNDCLASSW wc = {};
        wc.lpfnWndProc   = WndProc;
        wc.hInstance     = GetModuleHandleW(NULL);
        wc.lpszClassName = CLASS_NAME;
        wc.hbrBackground = (HBRUSH)(COLOR_BTNFACE + 1);
        wc.hCursor       = LoadCursorW(NULL, IDC_ARROW);
        RegisterClassW(&wc);

        HWND hwnd = CreateWindowExW(
            WS_EX_DLGMODALFRAME | WS_EX_TOPMOST,
            CLASS_NAME,
            L"Deskr - Consent required",
            WS_OVERLAPPED | WS_CAPTION | WS_SYSMENU,
            CW_USEDEFAULT, CW_USEDEFAULT, 480, 285,
            NULL, NULL, GetModuleHandleW(NULL), NULL
        );

        RECT rc;
        GetWindowRect(hwnd, &rc);
        int screenW = GetSystemMetrics(SM_CXSCREEN);
        int screenH = GetSystemMetrics(SM_CYSCREEN);
        int w = rc.right - rc.left;
        int h = rc.bottom - rc.top;
        SetWindowPos(hwnd, NULL, (screenW - w) / 2, (screenH - h) / 2, 0, 0, SWP_NOZORDER | SWP_NOSIZE);

        ShowWindow(hwnd, SW_SHOW);
        UpdateWindow(hwnd);

        MSG msg;
        while (GetMessageW(&msg, NULL, 0, 0)) {
            TranslateMessage(&msg);
            DispatchMessageW(&msg);
        }

        UnregisterClassW(CLASS_NAME, GetModuleHandleW(NULL));
        return s_accepted;
    }
}
