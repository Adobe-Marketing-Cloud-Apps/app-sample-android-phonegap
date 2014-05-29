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
%><%@ page session="false"
           import="com.day.cq.wcm.api.components.IncludeOptions" %><%
%><%@include file="/libs/foundation/global.jsp" %><%
%><%
    // Prevent wrapping of module .js content
    IncludeOptions opts = IncludeOptions.getOptions(request, true);
    opts.setDecorationTagName("");
    opts.forceSameContext(Boolean.TRUE);

    slingResponse.setContentType("application/javascript");

%>[
'ngRoute',
'ngTouch',
'ngAnimate',
'ngSanitize',
'cqContentSyncUpdate',
'cqAppControllers',
'cqAppNavigation',
'phonegapLocation'
]