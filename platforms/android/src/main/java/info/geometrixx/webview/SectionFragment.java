package info.geometrixx.webview;

import android.os.Bundle;
import android.support.v4.app.Fragment;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.io.InputStream;

/**
 * Section Fragment
 *
 * This is a typical Android fragment class that looks up data from a local JSON asset to display on the fragment layout.
 * The fragment layout is defined in section_view_frag.xml which contains a single TextView with an id of section_text.
 *
 * When the view is created the position value is used to obtain the correct article text form the JSON data.
 *
 */
public class SectionFragment extends Fragment {
    /**
     * The fragment argument representing the section number for this
     * fragment.
     */
    private static final String ARG_SECTION_NUMBER = "section_number";

    int mCurrentPosition = -1;

    /**
     * Instance of the JSON data that is loaded from assets/data.json
     */
    JSONObject mData = null;

    /**
     * Returns a new instance of this fragment for the given section
     * number.
     */
    public static SectionFragment newInstance(int sectionNumber) {
        SectionFragment fragment = new SectionFragment();
        Bundle args = new Bundle();
        args.putInt(ARG_SECTION_NUMBER, sectionNumber);
        fragment.setArguments(args);
        return fragment;
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Bundle args = getArguments();
        if (args != null) {
            // Set article based on argument passed in
            mCurrentPosition = args.getInt(ARG_SECTION_NUMBER);
        }
        //Initialize JSON article data
        mData = getJsonData();
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
            Bundle savedInstanceState) {

        // If activity recreated (such as from screen rotate), restore
        // the previous article selection set by onSaveInstanceState().
        // This is primarily necessary when in a two-pane layout.
        if (savedInstanceState != null) {
            mCurrentPosition = savedInstanceState.getInt(ARG_SECTION_NUMBER);
        }

        View rootView = inflater.inflate(R.layout.section_view_frag, container, false);
        try {
            updateSectionView(mCurrentPosition, rootView);
        } catch (JSONException e) {
            e.printStackTrace();
        }
        return rootView;
    }

    public void updateSectionView(int position, View view) throws JSONException {
        //Look up article text in JSON object
        JSONArray articleList = mData.getJSONArray("articles");
        if (position < articleList.length()) {
            TextView article = (TextView) view.findViewById(R.id.section_text);
            article.setText(articleList.getString(position));
        }
        mCurrentPosition = position;
    }

    @Override
    public void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);

        // Save the current article selection in case we need to recreate the fragment
        outState.putInt(ARG_SECTION_NUMBER, mCurrentPosition);
    }

    private JSONObject getJsonData() {

        try {

            InputStream is = getActivity().getAssets().open("data.json");
            int size = is.available();
            byte[] buffer = new byte[size];
            is.read(buffer);
            is.close();

            String json = new String(buffer, "UTF-8");

            return new JSONObject(json);


        } catch (IOException ex) {
            ex.printStackTrace();
        } catch (JSONException e) {
            e.printStackTrace();
        }

        return null;

    }
}
