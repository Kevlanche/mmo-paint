package com.mycompany;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;

public class GraphicsWriter {

	private static final String canonical_device_id = "rpi-sense-fb";

	private final File mGraphicDevice;

	private FileOutputStream mCurrOut;

	public GraphicsWriter() throws IOException {
		mGraphicDevice = getGraphicsDevice();
		if (mGraphicDevice == null) {
			throw new IOException("Couldn't locate graphics device");
		}
		System.out.println("Found graphics: " + mGraphicDevice);
	}

	public void open() throws IOException {
		try {
			close();
		} catch (IOException e) {
			e.printStackTrace(); // TODO supress?
		}
		mCurrOut = new FileOutputStream(mGraphicDevice);
	}

	public void close() throws IOException {
		if (mCurrOut == null) {
			return;
		}
		try {
			mCurrOut.close();
		} finally {
			mCurrOut = null;
		}
	}

	public void write(int r, int g, int b) throws IOException {
		write(rgb565(r, g, b));
	}

	public void write(short pixel) throws IOException {
		// TODO buffer everything in an array that is set to 0 at the start. Only actually open stream and write in close()
		if (mCurrOut == null) {
			throw new IOException("Open first!");
		}
		mCurrOut.write(pixel & 0xFF);
		mCurrOut.write((pixel >> 8) & 0xFF);
	}

	private static File getGraphicsDevice() throws IOException {
		final File dir = new File("/sys/class/graphics");
		for (File f : dir.listFiles()) {
			if (f.getCanonicalPath().contains(canonical_device_id)) {
				return new File("/dev/" + f.getName());
			}
		}
		return null;
	}

	public static short rgb565(int r, int g, int b) {
		final int red = (r >> 3) & 0x1F;
		final int green = (g >> 2) & 0x3F;
		final int blue = (b >> 3) & 0x1F;
		return (short) ((red << 11) + (green << 5) + blue);
	}
}
