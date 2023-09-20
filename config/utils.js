
module.exports.formatOrders = function(orders) {
    return orders.map(order => ({
        ...order.toObject(),
        formattedOrderDate: order.orderDate.toLocaleDateString()
    }));
};
