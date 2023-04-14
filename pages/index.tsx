import styles from "./styles/Home.module.css";
import {
  ThirdwebNftMedia,
  useAddress,
  useContract,
  useNFTs,
  Web3Button,
} from "@thirdweb-dev/react";
import type { NextPage } from "next";
import { useRef, useState } from "react";
const Home: NextPage = () => {
  const address = useAddress();

  // Fetch the NFT collection from thirdweb via it's contract address.
  const { contract: nftCollection } = useContract(
    // Replace this with your NFT Collection contract address
    process.env.NEXT_PUBLIC_NFT_COLLECTION_ADDRESS,
    "nft-collection"
  );
  const [file, setFile] = useState<File | undefined>();

  // We need the useRef to create the drag and drop feature
  const fileInputRef = useRef(null);
  // Function to store file in state when user uploads it
  const uploadFile = () => {
    if (fileInputRef?.current) {
      fileInputRef.current.click();
      fileInputRef.current.onchange = () => {
        if (fileInputRef?.current?.files?.length) {
          const file = fileInputRef.current.files[0];
          setFile(file);
        }
      };
    }
  };
  // Load all the minted NFTs in the collection
  const { data: nfts, isLoading: loadingNfts } = useNFTs(nftCollection);

  // Here we store the user inputs for their NFT.
  const [nftName, setNftName] = useState<string | undefined>();
  const url = file ? URL.createObjectURL(file) : "";

  // This function calls a Next JS API route that mints an NFT with signature-based minting.
  // We send in the address of the current user, and the text they entered as part of the request.
  const mintWithSignature = async () => {
    try {
      // Make a request to /api/server
      const signedPayloadReq = await fetch(`/api/server`, {
        method: "POST",
        body: JSON.stringify({
          authorAddress: address, // Address of the current user
          nftName: nftName || "",
          imagePath: url,
        }),
      });

      // Grab the JSON from the response
      const json = await signedPayloadReq.json();

      if (!signedPayloadReq.ok) {
        alert(json.error);
      }

      // If the request succeeded, we'll get the signed payload from the response.
      // The API should come back with a JSON object containing a field called signedPayload.
      // This line of code will parse the response and store it in a variable called signedPayload.
      const signedPayload = json.signedPayload;

      // Now we can call signature.mint and pass in the signed payload that we received from the server.
      // This means we provided a signature for the user to mint an NFT with.
      const nft = await nftCollection?.signature.mint(signedPayload);

      alert("Minted succesfully!");

      return nft;
    } catch (e) {
      console.error("An error occurred trying to mint the NFT:", e);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.h1}>Signature-Based Minting</h1>
      <p className={styles.explain}>
        Signature-based minting with{" "}
        <b>
          {" "}
          <a
            href="https://thirdweb.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.purple}
          >
            thirdweb
          </a>
        </b>{" "}
        + Next.JS to create a community-made NFT collection with restrictions.
      </p>

      <p>
        Hint: We only generate signatures if your NFT name is a cool{" "}
        <b>animal name</b>! 😉
      </p>

      <hr className={styles.divider} />

      <div className={styles.collectionContainer}>
        <h2 className={styles.ourCollection}>
          Mint your own NFT into the collection:
        </h2>

        <input
          type="text"
          placeholder="Name of your NFT"
          className={styles.textInput}
          maxLength={26}
          onChange={(e) => setNftName(e.target.value)}
        />
        <div className={styles.collectionContainer}>
          {file ? (
            <img
              src={URL.createObjectURL(file)}
              style={{ cursor: "pointer", maxHeight: 250, borderRadius: 8 }}
              onClick={() => setFile(undefined)}
            />
          ) : (
            <div
              className={styles.imageInput}
              onClick={uploadFile}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                setFile(e.dataTransfer.files[0]);
              }}
            >
              Drag and drop an image here to upload it!
            </div>
          )}
        </div>

        <input
          type="file"
          accept="image/png, image/gif, image/jpeg"
          id="profile-picture-input"
          ref={fileInputRef}
          style={{ display: "none" }}
        />
      </div>

      <div style={{ marginTop: 24 }}>
        <Web3Button
          contractAddress={process.env.NEXT_PUBLIC_NFT_COLLECTION_ADDRESS!}
          action={() => mintWithSignature()}
        >
          Mint NFT
        </Web3Button>
      </div>

      <hr className={styles.smallDivider} />

      <div className={styles.collectionContainer}>
        <h2 className={styles.ourCollection}>Other NFTs in this collection:</h2>

        {loadingNfts ? (
          <p>Loading...</p>
        ) : (
          <div className={styles.nftGrid}>
            {nfts?.map((nft) => (
              <div className={styles.nftItem} key={nft.metadata.id.toString()}>
                <div style={{ textAlign: "center" }}>
                  <p>Name</p>
                  <p>
                    <b>{nft.metadata.name}</b>
                  </p>
                </div>

                <div style={{ textAlign: "center" }}>
                  <p>Owned by</p>
                  <p>
                    <b>
                      {nft.owner
                        .slice(0, 6)
                        .concat("...")
                        .concat(nft.owner.slice(-4))}
                    </b>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
