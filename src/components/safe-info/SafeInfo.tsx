import { useCallback, useState } from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import { Skeleton, Theme } from "@mui/material";
import styled from "@emotion/styled";
import { utils } from "ethers";

import AddressLabel from "../address-label/AddressLabel";
import AmountLabel from "../amount-label/AmountLabel";
import getSafeInfo from "../../pages/api/getSafeInfo";
import useApi from "../../hooks/useApi";

import usePolling from "../../hooks/usePolling";
import { useAccountAbstraction } from "../../store/accountAbstractionContext";
import { useTheme } from "../../store/themeContext";
import isContractAddress from "../../utils/isContractAddress";
import Image from "next/image";

type SafeInfoProps = {
  safeAddress: string;
  chainId: string;
};

// TODO: ADD USDC LABEL
// TODO: ADD CHAIN LABEL

function SafeInfo({ safeAddress, chainId }: SafeInfoProps) {
  const { web3Provider, chain, safeBalance } = useAccountAbstraction();

  const [isDeployed, setIsDeployed] = useState<boolean>(false);
  const [isDeployLoading, setIsDeployLoading] = useState<boolean>(true);

  const { isDarkTheme } = useTheme();

  // detect if the safe is deployed with polling
  const detectSafeIsDeployed = useCallback(async () => {
    const isDeployed = await isContractAddress(safeAddress, web3Provider);

    setIsDeployed(isDeployed);
    setIsDeployLoading(false);
  }, [web3Provider, safeAddress]);

  usePolling(detectSafeIsDeployed);

  // safe info from Safe transaction service (used to know the threshold & owners of the Safe if its deployed)
  const fetchInfo = useCallback(
    (signal: AbortSignal) => getSafeInfo(safeAddress, chainId, { signal }),
    [safeAddress, chainId]
  );

  const { data: safeInfo, isLoading: isGetSafeInfoLoading } = useApi(fetchInfo);

  const owners = safeInfo?.owners.length || 1;
  const threshold = safeInfo?.threshold || 1;
  const isLoading = isDeployLoading || isGetSafeInfoLoading;

  return (
    <Stack direction="row" spacing={2}>
      <div style={{ position: "relative" }}>
        {/* Safe Logo */}
        {isLoading ? (
          <Skeleton variant="circular" width={50} height={50} />
        ) : (
          <Image
            src={
              isDarkTheme
                ? "/assets/safe-info-logo-dark.svg"
                : "/assets/safe-info-logo-light.svg"
            }
            alt="connected Safe account logo"
            width={10}
            height={10}
            className="h-7 w-auto"
          />
        )}

        {/* Threshold & owners label */}
        {isDeployed && (
          <SafeSettingsLabel>
            <Typography
              fontSize="12px"
              fontWeight="700"
              color="inherit"
              lineHeight="initial"
            >
              {threshold}/{owners}
            </Typography>
          </SafeSettingsLabel>
        )}
      </div>

      <Stack direction="column" spacing={0.5} alignItems="flex-start">
        {/* Safe address label */}
        <h2 className="text-sm">
          <AddressLabel address={safeAddress} showBlockExplorerLink />
        </h2>

        {isLoading && <Skeleton variant="text" width={110} height={20} />}

        <div>
          {" "}
          {!isDeployed && !isDeployLoading && (
            <CreationPendingLabel>
              <Tooltip title="This Safe is not deployed yet, it will be deployed when you execute the first transaction">
                <Typography fontWeight="700" fontSize="10px" color="inherit">
                  Creation pending
                </Typography>
              </Tooltip>
            </CreationPendingLabel>
          )}
          {!isLoading && (
            <AmountContainer>
              {/* Safe Balance */}
              <h5 className="font-bold text-xs">
                <AmountLabel
                  amount={utils.formatEther(safeBalance || "0")}
                  tokenSymbol={chain?.token || ""}
                />
              </h5>
            </AmountContainer>
          )}
        </div>
      </Stack>
    </Stack>
  );
}

export default SafeInfo;

const SafeSettingsLabel = styled("div")<{
  theme?: Theme;
}>(
  ({ theme }) => `
  position: absolute;
  top: -6px;
  right: -4px;
  border-radius: 50%;
  background-color: ${theme.palette.secondary.light};
  color: ${theme.palette.getContrastText(theme.palette.secondary.light)};
  padding: 5px 6px;
`
);

const CreationPendingLabel = styled("div")<{
  theme?: Theme;
}>(
  ({ theme }) => `
  border-radius: 4px;
  background-color: ${theme.palette.info.light};
  color: ${theme.palette.getContrastText(theme.palette.secondary.light)}; 
  padding: 0px 10px;
`
);

const AmountContainer = styled("div")<{
  theme?: Theme;
}>(
  ({ theme, onClick }) => `
  border-radius: 6px;
  background-color: ${theme.palette.background.light};
  padding: 0px 8px;
  cursor: ${!!onClick ? "pointer" : "initial"};
  `
);
