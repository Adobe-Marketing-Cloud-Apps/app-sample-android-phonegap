/*************************************************************************

ADOBE SYSTEMS INCORPORATED
Copyright 2015 Adobe Systems Incorporated
All Rights Reserved.

NOTICE:  Adobe permits you to use, modify, and distribute this file in accordance with the
terms of the Adobe license agreement accompanying it.  If you have received this file from a
source other than Adobe, then your use, modification, or distribution of it requires the prior
written permission of Adobe.
 
**************************************************************************/

#import "LocationTargetingController.h"
#import <QuartzCore/QuartzCore.h>
/*
 * Adobe Tracking - Analytics
 *
 * import ADBMobile.h so we can use methods from the SDK
 */
#import "ADBMobile.h"

@implementation LocationTargetingController

- (void) viewDidLoad {
	/*
	 * Adobe Tracking - Analytics
	 *
	 * call to trackState:data: for view states report
	 * trackState:data: increments the page view
	 */
	[ADBMobile trackState:@"Location Targeting Example" data:nil];
	
	// make our black background rounded
	_backgroundView.layer.cornerRadius = 5;
	_backgroundView.layer.masksToBounds = YES;
	
	// initilize our locations
	_seattle = [[CLLocation alloc] initWithLatitude:47.60621 longitude:-122.33207];
	_sanJose = [[CLLocation alloc] initWithLatitude:37.33939 longitude:-121.89496];
	_nyc = [[CLLocation alloc] initWithLatitude:40.71435 longitude:-74.00597];
	_dallas = [[CLLocation alloc] initWithLatitude:32.78014 longitude:-96.80045];
	_miami = [[CLLocation alloc] initWithLatitude:25.78897 longitude:-80.22644];
	
	// run first location targeting call
	[self runLocationTargeting];
}

- (void) sendLocationTrack:(CLLocation *)location {
    /* Adobe Tracking - Analytics
     *
     * standard tracking location call with our pre-determined CLLocation objects
     * once we have a location via trackLocation:data, the poi data will automatically be used
     * for subsequent calls to target
     */
    [ADBMobile trackLocation:location data:nil];
    
    
    [self runLocationTargeting];
}

- (void) runLocationTargeting {
	/* Adobe Tracking - Target
	 *
	 * reset cookies to ensure target gives us a different experience depending on user's location choice
	 * note: we are resetting cookies for this demo so the target server will allow us to reset experiences
	 */
	[ADBMobile targetClearCookies];
	
	
	/* Adobe Tracking - Target
	 *
	 * create a request for the geo targeting location
	 * default is black background and white text
	 */
	ADBTargetLocationRequest *locationRequest = [ADBMobile targetCreateRequestWithName:@"geoColors" defaultContent:@"ffffff/000000" parameters:nil];
	
	/* Adobe Tracking - Target
	 *
	 * send our location request and in the callback, change the colors we get back from target
	 */
	[ADBMobile targetLoadRequest:locationRequest callback:^(NSString *content) {
		// change colors
		NSArray *colors = [content componentsSeparatedByString: @"/"];
		
		if (colors.count != 2) {
			return;
		}
        
        [self performSelectorOnMainThread:@selector(changeColors:) withObject:colors waitUntilDone:NO];
	}];
}

- (void) changeColors:(NSArray *)newColors {
    if (![newColors isKindOfClass:[NSArray class]]) {
        return;
    }
    
    _textView.textColor = [newColors[0] color];
    _backgroundView.backgroundColor = [newColors[1] color];
}

- (IBAction) sendSeattle {
	[self sendLocationTrack:_seattle];
}

- (IBAction) sendSanJose {
	[self sendLocationTrack:_sanJose];
}

- (IBAction) sendNewYork {
	[self sendLocationTrack:_nyc];
}

- (IBAction) sendDallas {
	[self sendLocationTrack:_dallas];
}

- (IBAction) sendMiami {
	[self sendLocationTrack:_miami];
}

@end