const mongoose = require('mongoose');
const Wallet = require('../models/walletModel');


async function updateWalletBalance(userId, amount) {
  try {
    console.log('hfs')
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      wallet = new Wallet({
        userId,
        balance: amount,
      });
    } else {
      wallet.balance += amount;
    }
    console.log('rbkjbc')
    await wallet.save();
    return { success: true, message: 'Wallet updated successfully' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Error updating wallet' };
  }
}

module.exports = {
  updateWalletBalance,
};
