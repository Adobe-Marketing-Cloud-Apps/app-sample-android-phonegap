<%@page session="false"
          import="com.day.cq.wcm.api.WCMMode"%><%
%><%@include file="/libs/foundation/global.jsp" %><%
%><cq:includeClientLib css="apps.geometrixx-webview.splash-screen"/>

<c:set var="wcmMode"><%= WCMMode.fromRequest(request) != WCMMode.DISABLED %></c:set>

<c:if test="${!wcmMode}">
    <!-- Enable all requests, inline styles, and eval() -->
    <meta http-equiv="Content-Security-Policy" content="default-src *; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'">
</c:if>
