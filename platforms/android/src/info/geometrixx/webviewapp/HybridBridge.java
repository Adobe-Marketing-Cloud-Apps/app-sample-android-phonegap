package info.geometrixx.webviewapp;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;

import java.util.ArrayList;

public class HybridBridge extends CordovaPlugin {

    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        if ("navigate".equals(action)) {
            navigate(args, callbackContext);
            return true;
        }
        callbackContext.error("Invalid action");
        return false;
    }

    private void navigate(final JSONArray args, final CallbackContext callbackContext) {
        this.cordova.getActivity().runOnUiThread(new Runnable() {
            public void run() {
                navigateSync(args, callbackContext);
            }
        });
    }

    private void navigateSync(JSONArray args, final CallbackContext ctx) {
        try {
            PagerActivity pagerActivity = (PagerActivity) this.cordova.getActivity();
            String page = args.getString(0);
            pagerActivity.mViewPager.setCurrentItem(Integer.parseInt(page));
            ctx.success();
        } catch (Exception e) {
            String errorMessage = "An error occurred during navigation.";
            ctx.error(errorMessage);
        }
    }

}
