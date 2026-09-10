import { getStoreNotificationsAction } from './app/actions/notifications';
async function test() {
  console.time('fetch');
  const res = await getStoreNotificationsAction('cuid123');
  console.timeEnd('fetch');
  console.log(res);
}
test();
