#include "SystemInfo.h"
#include <Windows.h>
#include <comdef.h>
#include <Wbemidl.h>
#include <string>

#pragma comment(lib, "wbemuuid.lib")

namespace SystemInfo {

    std::string GetOperatingSystem() {
        std::string osVersion;

        HRESULT hr = CoInitializeEx(0, COINIT_MULTITHREADED);
        if (FAILED(hr)) return "Windows";

        hr = CoInitializeSecurity(NULL, -1, NULL, NULL,
            RPC_C_AUTHN_LEVEL_DEFAULT, RPC_C_IMP_LEVEL_IMPERSONATE,
            NULL, EOAC_NONE, NULL);

        IWbemLocator* pLoc = NULL;
        hr = CoCreateInstance(CLSID_WbemLocator, 0, CLSCTX_INPROC_SERVER,
            IID_IWbemLocator, (LPVOID*)&pLoc);

        if (FAILED(hr)) {
            CoUninitialize();
            return "Windows";
        }

        IWbemServices* pSvc = NULL;
        hr = pLoc->ConnectServer(_bstr_t(L"ROOT\\CIMV2"), NULL, NULL, 0, NULL, 0, 0, &pSvc);

        if (FAILED(hr)) {
            pLoc->Release();
            CoUninitialize();
            return "Windows";
        }

        hr = CoSetProxyBlanket(pSvc, RPC_C_AUTHN_WINNT, RPC_C_AUTHZ_NONE, NULL,
            RPC_C_AUTHN_LEVEL_CALL, RPC_C_IMP_LEVEL_IMPERSONATE, NULL, EOAC_NONE);

        IEnumWbemClassObject* pEnumerator = NULL;
        hr = pSvc->ExecQuery(bstr_t("WQL"), bstr_t("SELECT Caption FROM Win32_OperatingSystem"),
            WBEM_FLAG_FORWARD_ONLY | WBEM_FLAG_RETURN_IMMEDIATELY, NULL, &pEnumerator);

        if (SUCCEEDED(hr)) {
            IWbemClassObject* pclsObj = NULL;
            ULONG uReturn = 0;

            if (pEnumerator->Next(WBEM_INFINITE, 1, &pclsObj, &uReturn) == S_OK) {
                VARIANT vtProp;
                pclsObj->Get(L"Caption", 0, &vtProp, 0, 0);

                int size = WideCharToMultiByte(CP_UTF8, 0, vtProp.bstrVal, -1, NULL, 0, NULL, NULL);
                std::string caption(size - 1, 0);
                WideCharToMultiByte(CP_UTF8, 0, vtProp.bstrVal, -1, &caption[0], size, NULL, NULL);
                osVersion = caption;

                VariantClear(&vtProp);
                pclsObj->Release();
            }
            pEnumerator->Release();
        }

        pSvc->Release();
        pLoc->Release();
        CoUninitialize();

        if (osVersion.find("Windows") != std::string::npos) {
            if (osVersion.find("11") != std::string::npos) return "Windows 11";
            if (osVersion.find("10") != std::string::npos) return "Windows 10";
            if (osVersion.find("8.1") != std::string::npos) return "Windows 8.1";
            if (osVersion.find("8") != std::string::npos) return "Windows 8";
            if (osVersion.find("7") != std::string::npos) return "Windows 7";
        }

        return "Windows";
    }

}
