using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Agent.Core.Interfaces;
using Agent.Core.Models;

namespace Agent.Network.Http
{
    public class HttpApiClient : IApiClient
    {
        private readonly HttpClient _httpClient;
        public string BaseAddress { get; private set; } = string.Empty;
        public string Token { get; private set; } = string.Empty;

        public HttpApiClient()
        {
            _httpClient = new HttpClient();
        }

        public void Configure(string baseAddress, string? token = null)
        {
            BaseAddress = baseAddress?.TrimEnd('/') ?? string.Empty;
            if (!string.IsNullOrEmpty(token))
            {
                Token = token;
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", Token);
            }
            else
            {
                Token = string.Empty;
                _httpClient.DefaultRequestHeaders.Authorization = null;
            }
        }

        public async Task<AuthResult> LoginAsync(string email, string password)
        {
            var result = new AuthResult { IsSuccess = false };
            if (string.IsNullOrEmpty(BaseAddress))
            {
                result.ErrorMessage = "API Client is not configured. Server URL is missing.";
                return result;
            }

            try
            {
                var loginData = new { email, password };
                string json = JsonSerializer.Serialize(loginData);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                HttpResponseMessage response = await _httpClient.PostAsync($"{BaseAddress}/api/legacy/auth/login", content);
                string responseString = await response.Content.ReadAsStringAsync();

                using (JsonDocument doc = JsonDocument.Parse(responseString))
                {
                    var root = doc.RootElement;
                    if (response.IsSuccessStatusCode && root.GetProperty("status").GetString() == "success")
                    {
                        var dataNode = root.GetProperty("data");
                        string token = dataNode.GetProperty("accessToken").GetString() ?? "";
                        var userNode = dataNode.GetProperty("user");
                        string userId = userNode.GetProperty("id").GetString() ?? "";
                        string firstName = userNode.GetProperty("firstName").GetString() ?? "";
                        string lastName = userNode.GetProperty("lastName").GetString() ?? "";

                        Configure(BaseAddress, token);

                        result.IsSuccess = true;
                        result.AccessToken = token;
                        result.UserId = userId;
                        result.FirstName = firstName;
                        result.LastName = lastName;
                    }
                    else
                    {
                        result.ErrorMessage = root.TryGetProperty("message", out var msgElement) 
                            ? (msgElement.GetString() ?? "Authentication Rejected") 
                            : "Authentication Rejected";
                    }
                }
            }
            catch (Exception ex)
            {
                result.ErrorMessage = $"Network failure: {ex.Message}";
            }

            return result;
        }

        public async Task<bool> RegisterDeviceAsync(string fingerprint, string name)
        {
            try
            {
                var regPayload = new { fingerprint, name };
                string json = JsonSerializer.Serialize(regPayload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                HttpResponseMessage res = await _httpClient.PostAsync($"{BaseAddress}/api/legacy/devices/register", content);
                return res.IsSuccessStatusCode;
            }
            catch
            {
                return false;
            }
        }

        public async Task<AttendanceStatus> GetAttendanceStatusAsync()
        {
            var status = new AttendanceStatus { IsClockedIn = false, IsShiftCompleted = false };
            try
            {
                HttpResponseMessage res = await _httpClient.GetAsync($"{BaseAddress}/api/legacy/attendance/status");
                if (res.IsSuccessStatusCode)
                {
                    string body = await res.Content.ReadAsStringAsync();
                    using (JsonDocument doc = JsonDocument.Parse(body))
                    {
                        var data = doc.RootElement.GetProperty("data");
                        status.IsClockedIn = data.GetProperty("clockedIn").GetBoolean();

                        bool hasShiftRecord = data.TryGetProperty("attendance", out var attNode) && attNode.ValueKind != JsonValueKind.Null;
                        bool hasClockedOut = hasShiftRecord && attNode.TryGetProperty("clockOut", out var clockOutNode) && clockOutNode.ValueKind != JsonValueKind.Null;

                        if (hasClockedOut)
                        {
                            status.IsShiftCompleted = true;
                        }
                    }
                }
            }
            catch
            {
                // ignore
            }
            return status;
        }

        public async Task<bool> ClockInAsync()
        {
            try
            {
                HttpResponseMessage response = await _httpClient.PostAsync($"{BaseAddress}/api/legacy/attendance/clock-in", null);
                return response.IsSuccessStatusCode;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> ClockOutAsync()
        {
            try
            {
                HttpResponseMessage response = await _httpClient.PostAsync($"{BaseAddress}/api/legacy/attendance/clock-out", null);
                return response.IsSuccessStatusCode;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> StartWorkSessionAsync()
        {
            try
            {
                HttpResponseMessage res = await _httpClient.PostAsync($"{BaseAddress}/api/legacy/work-sessions/start", null);
                return res.IsSuccessStatusCode;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> StopWorkSessionAsync(string? reason = null)
        {
            try
            {
                HttpContent? content = null;
                if (!string.IsNullOrEmpty(reason))
                {
                    string json = JsonSerializer.Serialize(new { reason });
                    content = new StringContent(json, Encoding.UTF8, "application/json");
                }
                HttpResponseMessage res = await _httpClient.PostAsync($"{BaseAddress}/api/legacy/work-sessions/stop", content);
                return res.IsSuccessStatusCode;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> UpdateLastSessionReasonAsync(string reason)
        {
            try
            {
                string json = JsonSerializer.Serialize(new { reason });
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                HttpResponseMessage res = await _httpClient.PostAsync($"{BaseAddress}/api/legacy/work-sessions/update-reason", content);
                return res.IsSuccessStatusCode;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> SendHeartbeatAsync(object payload)
        {
            try
            {
                string json = JsonSerializer.Serialize(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                HttpResponseMessage res = await _httpClient.PostAsync($"{BaseAddress}/api/legacy/work-sessions/heartbeat", content);
                return res.IsSuccessStatusCode;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> UploadScreenshotAsync(object payload)
        {
            try
            {
                string json = JsonSerializer.Serialize(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                HttpResponseMessage res = await _httpClient.PostAsync($"{BaseAddress}/api/legacy/work-sessions/screenshot", content);
                return res.IsSuccessStatusCode;
            }
            catch
            {
                return false;
            }
        }
    }
}
