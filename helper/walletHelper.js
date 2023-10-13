const mongoose = require('mongoose');
const Wallet = require('../models/walletModel');


async function updateWalletBalance(userId, amount, transactionType) {
  try {
    let wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      wallet = new Wallet({
        userId,
        balance: 0, 
        transactions: [], 
      });
    }

    if (transactionType === 'debit') {
      if (wallet.balance >= amount) {
        wallet.balance -= Math.abs(amount); 
      } else {
        throw new Error('Insufficient balance in wallet');
      }
    } else if (transactionType === 'credit') {
      wallet.balance += Math.abs(amount);
    } else {
      throw new Error('Invalid transaction type');
    }

    const newTransaction = {
      date: new Date(),
      type: transactionType,
      amount: amount,
    };

    wallet.transactions.push(newTransaction);

    await wallet.save();
    
    return { success: true, message: 'Wallet updated successfully' };
  } catch (error) {
    console.error(error);
    return { success: false, message: error.message };
  }
}


module.exports = {
  updateWalletBalance,
};
