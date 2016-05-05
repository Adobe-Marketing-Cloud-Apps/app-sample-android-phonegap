package info.geometrixx.webviewapp;

import android.app.ActionBar;
import android.support.design.widget.FloatingActionButton;
import android.support.design.widget.Snackbar;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;

import android.support.v4.app.Fragment;
import android.support.v4.app.FragmentManager;
import android.support.v4.app.FragmentPagerAdapter;
import android.support.v4.view.ViewPager;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;

import android.widget.TextView;

import com.roughike.bottombar.BottomBar;
import com.roughike.bottombar.BottomBarTab;
import com.roughike.bottombar.OnTabClickListener;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.io.InputStream;

public class PagerActivity extends AppCompatActivity implements ViewPager.OnPageChangeListener {

    /**
     * The {@link android.support.v4.view.PagerAdapter} that will provide
     * fragments for each of the sections. We use a
     * {@link FragmentPagerAdapter} derivative, which will keep every
     * loaded fragment in memory. If this becomes too memory intensive, it
     * may be best to switch to a
     * {@link android.support.v4.app.FragmentStatePagerAdapter}.
     */
    private SectionsPagerAdapter mSectionsPagerAdapter;

    /**
     * The {@link ViewPager} that will host the section contents.
     */
    public ViewPager mViewPager;
    private BottomBar mBottomBar;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_pager);

        // Create the adapter that will return a fragment for each of the three
        // primary sections of the activity.
        mSectionsPagerAdapter = new SectionsPagerAdapter(getSupportFragmentManager());

        // Set up the ViewPager with the sections adapter.
        mViewPager = (ViewPager) findViewById(R.id.container);
        mViewPager.setAdapter(mSectionsPagerAdapter);
        mViewPager.addOnPageChangeListener(this);

        FloatingActionButton fab = (FloatingActionButton) findViewById(R.id.fab);
        fab.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                Snackbar.make(view, "Replace with your own action", Snackbar.LENGTH_LONG)
                        .setAction("Action", null).show();
            }
        });

        // Bottom Bar
        mBottomBar = BottomBar.attach(this,savedInstanceState);
        mBottomBar.setItems(
                new BottomBarTab(R.drawable.ic_favorite_white_24dp, "Home"),
                new BottomBarTab(R.drawable.ic_update_white_24dp, "Bookmarks")
        );
        mBottomBar.setOnTabClickListener(new OnTabClickListener() {
            @Override
            public void onTabSelected(int position) {
                mViewPager.setCurrentItem(position);
            }

            @Override
            public void onTabReSelected(int position) {
                return;
            }
        });
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        mBottomBar.onSaveInstanceState(outState);
    }

    @Override
    public void onPageScrolled(int position, float positionOffset, int positionOffsetPixels) {

    }

    @Override
    public void onPageSelected(int position) {
        mBottomBar.selectTabAtPosition(position, true);
    }

    @Override
    public void onPageScrollStateChanged(int state) {

    }

    /**
     * Section Fragment
     *
     * This is a typical Android fragment class that looks up data from a local JSON asset to display on the fragment layout.
     * The fragment layout is defined in section_view_frag.xml which contains a single TextView with an id of section_text.
     *
     * When the view is created the position value is used to obtain the correct article text form the JSON data.
     */
    public static class PlaceholderFragment extends Fragment {
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

        public PlaceholderFragment() {
        }

        /**
         * Returns a new instance of this fragment for the given section
         * number.
         */
        public static PlaceholderFragment newInstance(int sectionNumber) {
            PlaceholderFragment fragment = new PlaceholderFragment();
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

            if (savedInstanceState != null) {
                mCurrentPosition = savedInstanceState.getInt(ARG_SECTION_NUMBER);
            }

            View rootView = inflater.inflate(R.layout.fragment_pager, container, false);
            try {
                updateSectionView(mCurrentPosition, rootView);
            } catch (JSONException e) {
                e.printStackTrace();
            }
            return rootView;
        }

        @Override
        public void onSaveInstanceState(Bundle outState) {
            super.onSaveInstanceState(outState);
            // Save the current article selection in case we need to recreate the fragment
            outState.putInt(ARG_SECTION_NUMBER, mCurrentPosition);
        }

        public void updateSectionView(int position, View view) throws JSONException {
            //Look up article text in JSON object
            JSONArray articleList = mData.getJSONArray("articles");
            if (position < articleList.length()) {
                TextView article = (TextView) view.findViewById(R.id.section_label);
                article.setText(articleList.getString(position));
            }
            mCurrentPosition = position;
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

    /**
     * A {@link FragmentPagerAdapter} that returns a fragment corresponding to
     * one of the sections/tabs/pages.
     */
    public class SectionsPagerAdapter extends FragmentPagerAdapter {

        public SectionsPagerAdapter(FragmentManager fm) {
            super(fm);
        }

        @Override
        public Fragment getItem(int position) {
            if (position == 0) {
                return HomeFragment.newInstance();
            } else {
                // getItem is called to instantiate the fragment for the given page.
                // Return a PlaceholderFragment (defined as a static inner class below).
                return PlaceholderFragment.newInstance(position);
            }
        }

        @Override
        public int getCount() {
            // Show 2 total pages.
            return 2;
        }

        @Override
        public CharSequence getPageTitle(int position) {
            switch (position) {
                case 0:
                    return "SECTION 1";
                case 1:
                    return "SECTION 2";
            }
            return null;
        }

    }
}
