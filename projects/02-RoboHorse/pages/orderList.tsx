import { Default } from 'components/layouts/Default';
import OrderList from 'components/templates/OrderList';
import type { NextPage } from 'next';

const OrderPage: NextPage = () => {
  return (
    <Default pageName="orderList">
      <OrderList />
    </Default>
  );
};

export default OrderPage;
