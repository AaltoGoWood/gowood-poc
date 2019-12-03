FROM holochain/holonix:ubuntu

# this basically initialzie holochain for the default user (docker)
RUN curl https://nixos.org/nix/install | sh
RUN . /home/docker/.nix-profile/etc/profile.d/nix.sh

EXPOSE 8888
WORKDIR /holochain
# Keep container up and running
CMD . /home/docker/.nix-profile/etc/profile.d/nix.sh && tail -f /dev/null