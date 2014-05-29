<%@include file="/libs/foundation/global.jsp" %><%
%><%@ page session="false" %><%
%>
<div class="location-details" ng-controller="LocationCtrl">
    <div class="location-container">
        <h3>{{locations[0].label}}</h3>
        <div class="location-map">
            <cq-map zoom="16" maptype="roadmap" center="origin" markers="locations" refresh="showMap">
                Loading map...
            </cq-map>
        </div>
    </div>
</div>
