#pragma once
#include <string>
#include <map>

class JsonParser {
public:
    static std::map<std::string, std::string> Parse(const std::string& json) {
        std::map<std::string, std::string> result;
        size_t pos = 0;

        while (pos < json.size()) {
            size_t keyStart = json.find('"', pos);
            if (keyStart == std::string::npos) break;
            keyStart++;

            size_t keyEnd = json.find('"', keyStart);
            if (keyEnd == std::string::npos) break;

            std::string key = json.substr(keyStart, keyEnd - keyStart);
            pos = keyEnd + 1;

            size_t colonPos = json.find(':', pos);
            if (colonPos == std::string::npos) break;
            pos = colonPos + 1;

            while (pos < json.size() && (json[pos] == ' ' || json[pos] == '\t' || json[pos] == '\n' || json[pos] == '\r'))
                pos++;

            if (pos >= json.size()) break;

            std::string value;
            if (json[pos] == '"') {
                pos++;
                size_t valEnd = json.find('"', pos);
                if (valEnd == std::string::npos) break;
                value = json.substr(pos, valEnd - pos);
                pos = valEnd + 1;
            }
            else {
                size_t valEnd = json.find_first_of(",}", pos);
                if (valEnd == std::string::npos) valEnd = json.size();
                value = json.substr(pos, valEnd - pos);
                while (!value.empty() && (value.back() == ' ' || value.back() == '\n' || value.back() == '\r'))
                    value.pop_back();
                pos = valEnd;
            }

            result[key] = value;
        }

        return result;
    }
};
