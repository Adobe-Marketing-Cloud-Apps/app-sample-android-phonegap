<%--
  ADOBE CONFIDENTIAL
  __________________

   Copyright 2013 Adobe Systems Incorporated
   All Rights Reserved.

  NOTICE:  All information contained herein is, and remains
  the property of Adobe Systems Incorporated and its suppliers,
  if any.  The intellectual and technical concepts contained
  herein are proprietary to Adobe Systems Incorporated and its
  suppliers and are protected by trade secret or copyright law.
  Dissemination of this information or reproduction of this material
  is strictly forbidden unless prior written permission is obtained
  from Adobe Systems Incorporated.
--%><%
%><%@page session="false" %><%
%><%@include file="/libs/foundation/global.jsp" %><%
%>
<!-- Enable all requests, inline styles, and eval() -->
<!-- TODO: set a more restrictive CSP for production -->
<meta http-equiv="Content-Security-Policy" content="default-src 'self' gap://ready; style-src 'self' 'unsafe-inline' http://fonts.googleapis.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' http://maps.googleapis.com; connect-src *; img-src *">
<!-- Disable telephone number detection in iOS webview -->
<meta name = "format-detection" content = "telephone=no">

<cq:includeClientLib css="apps.geometrixx-webview.all"/>