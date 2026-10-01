// Simulated Easypaisa payment processing
// In production, integrate with actual Easypaisa API

const simulateEasypaisaPayment = async (amount, mobileNumber, description = '') => {
  console.log(`Simulating Easypaisa payment of PKR ${amount} to ${mobileNumber}`);
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Generate mock transaction ID
  const transactionId = `EASY${Date.now().toString().slice(-10)}`;
  
  // Simulate success/failure (90% success rate)
  const success = Math.random() > 0.1;
  
  if (success) {
    return {
      success: true,
      transactionId,
      amount,
      mobileNumber,
      timestamp: new Date(),
      status: 'completed',
      message: 'Payment processed successfully'
    };
  } else {
    return {
      success: false,
      transactionId,
      amount,
      mobileNumber,
      timestamp: new Date(),
      status: 'failed',
      message: 'Payment processing failed. Please try again.'
    };
  }
};

const verifyEasypaisaTransaction = async (transactionId) => {
  console.log(`Verifying Easypaisa transaction: ${transactionId}`);
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Simulate verification (always success for mock)
  return {
    success: true,
    transactionId,
    verified: true,
    verificationTime: new Date(),
    message: 'Transaction verified successfully'
  };
};

module.exports = {
  simulateEasypaisaPayment,
  verifyEasypaisaTransaction
};