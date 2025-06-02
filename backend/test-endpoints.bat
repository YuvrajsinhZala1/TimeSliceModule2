@echo off
echo Testing TimeSlice Backend Endpoints
echo ===================================

echo.
echo 1. Testing Health Check...
curl -w "Status: %%{http_code}\n" http://localhost:5000/health

echo.
echo 2. Testing API Root...
curl -w "Status: %%{http_code}\n" http://localhost:5000/api

echo.
echo 3. Testing Signup Endpoint...
curl -X POST http://localhost:5000/api/auth/signup ^
  -H "Content-Type: application/json" ^
  -w "Status: %%{http_code}\n" ^
  -d "{\"username\":\"testuser123\",\"email\":\"test123@example.com\",\"password\":\"password123\"}"

echo.
echo 4. Testing Login Endpoint...
curl -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -w "Status: %%{http_code}\n" ^
  -d "{\"identifier\":\"testuser123\",\"password\":\"password123\"}"

echo.
echo Testing complete!
pause