// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   chrome.cookies.getAll(
//     {
//       domain: "eoms.ultrapower.com.cn",
//     },
//     (cks) => {
//       sendResponse(
//         cks
//           .filter(({ path }) => path === "/ultrasoa")
//           .map(({ name, value }) => name + "=" + value)
//           .join(";") + ";"
//       );
//     }
//   );
//   return true;
// });
