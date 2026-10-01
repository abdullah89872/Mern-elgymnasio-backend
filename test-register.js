// Test registration endpoint
const testRegister = async () => {
  try {
    const response = await fetch('http://localhost:5002/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fullName: 'Test User',
        email: 'testuser@example.com',
        phone: '+923001234567',
        password: 'test123',
        confirmPassword: 'test123'
      })
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', data);
    return data;
  } catch (error) {
    console.error('Error:', error.message);
  }
};

testRegister();
